package ticket

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/features/auth"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/webhook"
	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/dbpool"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
	"github.com/elastic/go-elasticsearch/v8"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	ErrNotFound        = errors.New("ticket not found")
	ErrInvalidInput    = errors.New("invalid input")
	ErrForbidden       = errors.New("forbidden")
	ErrAlreadyActioned = errors.New("ticket already actioned")
)

// CreateTicket creates a new pending ticket.
func CreateTicket(ctx context.Context, projectID, applicantID string, title, description, instructionJSON, approvalMode string) (*DTO, error) {
	if projectID == "" || applicantID == "" || instructionJSON == "" {
		return nil, ErrInvalidInput
	}
	if approvalMode == "" {
		approvalMode = project.ApprovalModeAnyOne
	}
	if approvalMode != project.ApprovalModeAnyOne && approvalMode != project.ApprovalModeAll {
		return nil, ErrInvalidInput
	}

	// Verify project exists
	_, err := project.GetByID(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	t := &Ticket{
		ProjectID:       projectID,
		ApplicantID:     applicantID,
		Title:           title,
		Description:     description,
		InstructionJSON: instructionJSON,
		Status:          StatusPending,
		ApprovalMode:    approvalMode,
	}
	if err := Create(ctx, t); err != nil {
		return nil, err
	}

	// Send webhook for ticket.created
	webhook.SendWebhook(ctx, "ticket.created", map[string]interface{}{
		"ticket_id":    t.ID,
		"project_id":   projectID,
		"applicant_id": applicantID,
		"status":       t.Status,
	})

	return ToDTO(t), nil
}

// ApproveTicket approves a ticket. Checks approval mode and auto-executes if condition met.
// Members with admin or approver role can approve. System admins can also approve.
func ApproveTicket(ctx context.Context, ticketID, approverID string, comment string) (*DTO, error) {
	if ticketID == "" || approverID == "" {
		return nil, ErrInvalidInput
	}

	t, err := GetTicketByID(ctx, ticketID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if t.Status != StatusPending {
		return nil, ErrAlreadyActioned
	}

	// Check if user has already approved
	existingApprovals, err := ListApprovalRecords(ctx, ticketID)
	if err != nil {
		return nil, err
	}
	for _, a := range existingApprovals {
		if a.ApproverID == approverID {
			return nil, ErrAlreadyActioned
		}
	}

	// Check if user can approve: must be admin/approver in project or system_admin
	approverIDs, err := project.GetProjectApproverIDs(ctx, t.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("get approvers failed: %w", err)
	}

	isApprover := false
	for _, id := range approverIDs {
		if id == approverID {
			isApprover = true
			break
		}
	}

	isSysAdmin := false
	codes, codeErr := auth.GetUserPermissionCodes(ctx, approverID)
	if codeErr == nil {
		isSysAdmin = auth.HasPermission(codes, "*")
	}

	if !isApprover && !isSysAdmin {
		return nil, ErrForbidden
	}

	// Create approval record
	record := &ApprovalRecord{
		TicketID:   ticketID,
		ApproverID: approverID,
		Action:     "approved",
		Comment:    comment,
	}
	if err := CreateApprovalRecord(ctx, record); err != nil {
		return nil, err
	}

	// Check if execution condition is met
	shouldExecute := false

	if t.ApprovalMode == project.ApprovalModeAnyOne {
		// First approval auto-executes
		shouldExecute = true
	} else {
		// all mode: check if all approvers have approved
		approvedCount, err := CountApprovedRecords(ctx, ticketID)
		if err != nil {
			return nil, err
		}
		if int(approvedCount) >= len(approverIDs) {
			shouldExecute = true
		}
	}

	if shouldExecute {
		t.Status = StatusApproved
		if err := SaveTicket(ctx, t); err != nil {
			return nil, err
		}

		webhook.SendWebhook(ctx, "ticket.approved", map[string]interface{}{
			"ticket_id":   t.ID,
			"project_id":  t.ProjectID,
			"approver_id": approverID,
			"status":      t.Status,
		})

		// Auto-execute
		if err := ExecuteTicket(ctx, ticketID); err != nil {
			global.Log.Error("auto-execute ticket failed", zap.String("ticket_id", ticketID), zap.Error(err))
		}
	} else {
		// all mode: not all approvers yet — keep as pending
		webhook.SendWebhook(ctx, "ticket.partially_approved", map[string]interface{}{
			"ticket_id":   t.ID,
			"project_id":  t.ProjectID,
			"approver_id": approverID,
			"status":      t.Status,
		})
	}

	return ToDTO(t), nil
}

// RejectTicket rejects a ticket.
func RejectTicket(ctx context.Context, ticketID, approverID string, comment string) (*DTO, error) {
	if ticketID == "" || approverID == "" {
		return nil, ErrInvalidInput
	}

	t, err := GetTicketByID(ctx, ticketID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if t.Status != StatusPending {
		return nil, ErrAlreadyActioned
	}

	// Check if user can approve (same permission as approving)
	approverIDs, err := project.GetProjectApproverIDs(ctx, t.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("get approvers failed: %w", err)
	}

	isApprover := false
	for _, id := range approverIDs {
		if id == approverID {
			isApprover = true
			break
		}
	}

	isSysAdmin := false
	codes, codeErr := auth.GetUserPermissionCodes(ctx, approverID)
	if codeErr == nil {
		isSysAdmin = auth.HasPermission(codes, "*")
	}

	if !isApprover && !isSysAdmin {
		return nil, ErrForbidden
	}

	record := &ApprovalRecord{
		TicketID:   ticketID,
		ApproverID: approverID,
		Action:     "rejected",
		Comment:    comment,
	}
	if err := CreateApprovalRecord(ctx, record); err != nil {
		return nil, err
	}

	t.Status = StatusRejected
	if err := SaveTicket(ctx, t); err != nil {
		return nil, err
	}

	webhook.SendWebhook(ctx, "ticket.rejected", map[string]interface{}{
		"ticket_id":   t.ID,
		"project_id":  t.ProjectID,
		"approver_id": approverID,
		"status":      t.Status,
	})

	return ToDTO(t), nil
}

// ExecuteTicket executes the instructions against the project's datasource.
func ExecuteTicket(ctx context.Context, ticketID string) error {
	t, err := GetTicketByID(ctx, ticketID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}

	if t.Status != StatusApproved {
		return ErrAlreadyActioned
	}

	proj, err := project.GetByID(ctx, t.ProjectID)
	if err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	// Unmarshal instructions
	var insts []pipeline.Instruction
	if err := json.Unmarshal([]byte(t.InstructionJSON), &insts); err != nil {
		return fmt.Errorf("unmarshal instructions failed: %w", err)
	}
	if len(insts) == 0 {
		return fmt.Errorf("no instructions to execute")
	}

	t.Status = StatusExecuting
	if err := SaveTicket(ctx, t); err != nil {
		return err
	}

	start := time.Now()
	execErrStr := ""

	// Determine execution path based on instruction type group
	switch insts[0].TypeGroup {
	case "sql":
		pool, err := dbpool.Get(ctx, proj.DatasourceID)
		if err != nil {
			t.Status = StatusExecuteFailed
			_ = SaveTicket(ctx, t)
			writeTicketAuditLog(ctx, t, proj, audit.StatusFailed, fmt.Sprintf("get db connection failed: %v", err), 0, t.InstructionJSON)
			sendTicketWebhook(ctx, t, "ticket.execution_failed", err.Error())
			return fmt.Errorf("get db connection failed: %w", err)
		}
		for _, inst := range insts {
			stmt := inst.Raw
			_, execErr := pool.ExecContext(ctx, stmt)
			if execErr != nil {
				if execErrStr == "" {
					execErrStr = execErr.Error()
				} else {
					execErrStr += "; " + execErr.Error()
				}
			}
		}

	case "nosql":
		switch insts[0].Type {
		case "redis":
			client, err := dbpool.GetRedis(ctx, proj.DatasourceID)
			if err != nil {
				t.Status = StatusExecuteFailed
				_ = SaveTicket(ctx, t)
				writeTicketAuditLog(ctx, t, proj, audit.StatusFailed, fmt.Sprintf("get redis connection failed: %v", err), 0, t.InstructionJSON)
				sendTicketWebhook(ctx, t, "ticket.execution_failed", err.Error())
				return fmt.Errorf("get redis connection failed: %w", err)
			}
			for _, inst := range insts {
				args := make([]any, 0, len(inst.Args)+1)
				args = append(args, inst.Command)
				for _, a := range inst.Args {
					args = append(args, a)
				}
				if err := client.Do(ctx, args...).Err(); err != nil {
					if execErrStr == "" {
						execErrStr = err.Error()
					} else {
						execErrStr += "; " + err.Error()
					}
				}
			}
		case "mongo":
			client, err := dbpool.GetMongo(ctx, proj.DatasourceID)
			if err != nil {
				t.Status = StatusExecuteFailed
				_ = SaveTicket(ctx, t)
				writeTicketAuditLog(ctx, t, proj, audit.StatusFailed, fmt.Sprintf("get mongo connection failed: %v", err), 0, t.InstructionJSON)
				sendTicketWebhook(ctx, t, "ticket.execution_failed", err.Error())
				return fmt.Errorf("get mongo connection failed: %w", err)
			}
			for _, inst := range insts {
				dbName := "admin"
				if proj.Scope != "" {
					dbName = proj.Scope
				}
				if err := client.Database(dbName).RunCommand(ctx, []byte(inst.Raw)).Err(); err != nil {
					if execErrStr == "" {
						execErrStr = err.Error()
					} else {
						execErrStr += "; " + err.Error()
					}
				}
			}
		default:
			return fmt.Errorf("unsupported nosql type for ticket execution: %s", insts[0].Type)
		}

	case "search":
		switch insts[0].Type {
		case "es":
			client, err := dbpool.GetES(ctx, proj.DatasourceID)
			if err != nil {
				t.Status = StatusExecuteFailed
				_ = SaveTicket(ctx, t)
				writeTicketAuditLog(ctx, t, proj, audit.StatusFailed, fmt.Sprintf("get es connection failed: %v", err), 0, t.InstructionJSON)
				sendTicketWebhook(ctx, t, "ticket.execution_failed", err.Error())
				return fmt.Errorf("get es connection failed: %w", err)
			}
			for _, inst := range insts {
				if err := executeESWrite(ctx, client, inst); err != nil {
					if execErrStr == "" {
						execErrStr = err.Error()
					} else {
						execErrStr += "; " + err.Error()
					}
				}
			}
		default:
			return fmt.Errorf("unsupported search type for ticket execution: %s", insts[0].Type)
		}

	default:
		return fmt.Errorf("unsupported type group for ticket execution: %s", insts[0].TypeGroup)
	}

	duration := int(time.Since(start).Milliseconds())

	if execErrStr != "" {
		t.Status = StatusExecuteFailed
		t.ExecutionStatus = "failed"
		t.ExecutionError = execErrStr
		now := time.Now()
		t.ExecutedAt = &now
		_ = SaveTicket(ctx, t)
		writeTicketAuditLog(ctx, t, proj, audit.StatusFailed, execErrStr, duration, t.InstructionJSON)
		sendTicketWebhook(ctx, t, "ticket.execution_failed", execErrStr)
		return fmt.Errorf("execution failed: %s", execErrStr)
	}

	t.Status = StatusExecuted
	t.ExecutionStatus = "success"
	now := time.Now()
	t.ExecutedAt = &now
	if err := SaveTicket(ctx, t); err != nil {
		return err
	}
	writeTicketAuditLog(ctx, t, proj, audit.StatusSuccess, "", duration, t.InstructionJSON)
	sendTicketWebhook(ctx, t, "ticket.executed", "")
	return nil
}

func writeTicketAuditLog(ctx context.Context, t *Ticket, proj *project.DataProject, status, errMsg string, durationMs int, instructionJSON string) {
	audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
		ActorID:         t.ApplicantID,
		ProjectID:       t.ProjectID,
		DatasourceID:    proj.DatasourceID,
		Action:          "ticket_execute",
		RawText:         instructionJSON,
		InstructionJSON: instructionJSON,
		Classification:  "write",
		Status:          status,
		ErrorMessage:    errMsg,
		DurationMs:      durationMs,
		TicketID:        t.ID,
	})
}

func sendTicketWebhook(ctx context.Context, t *Ticket, event, errMsg string) {
	payload := map[string]interface{}{
		"ticket_id":  t.ID,
		"project_id": t.ProjectID,
		"status":     t.Status,
	}
	if errMsg != "" {
		payload["error"] = errMsg
	}
	webhook.SendWebhook(ctx, event, payload)
}

// GetTicketDetail returns ticket + approvals + related audit logs.
func GetTicketDetail(ctx context.Context, ticketID string) (*TicketDetail, error) {
	t, err := GetTicketByID(ctx, ticketID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	approvals, err := ListApprovalRecords(ctx, ticketID)
	if err != nil {
		return nil, err
	}

	// Get related audit logs for this ticket
	audits, err := audit.ListByTicketID(ctx, ticketID)
	if err != nil {
		return nil, err
	}

	approvalDTOs := make([]*ApprovalRecordDTO, 0, len(approvals))
	for i := range approvals {
		approvalDTOs = append(approvalDTOs, ToApprovalRecordDTO(&approvals[i]))
	}

	return &TicketDetail{
		Ticket:    ToDTO(t),
		Approvals: approvalDTOs,
		Audits:    audits,
	}, nil
}

// ListTicketsForUser lists tickets based on scope.
func ListTicketsForUser(ctx context.Context, userID string, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
	scope := filters["scope"]

	switch scope {
	case "my":
		items, total, err := ListTicketsByApplicant(ctx, userID, pq, filters)
		if err != nil {
			return nil, 0, err
		}
		result := make([]*DTO, 0, len(items))
		for i := range items {
			result = append(result, ToDTO(&items[i]))
		}
		return result, total, nil
	case "pending":
		// Pending tickets where user is an approver
		filters["status"] = "=pending"
		items, total, err := ListTickets(ctx, pq, filters)
		if err != nil {
			return nil, 0, err
		}
		result := make([]*DTO, 0, len(items))
		for i := range items {
			result = append(result, ToDTO(&items[i]))
		}
		return result, total, nil
	default:
		items, total, err := ListTickets(ctx, pq, filters)
		if err != nil {
			return nil, 0, err
		}
		result := make([]*DTO, 0, len(items))
		for i := range items {
			result = append(result, ToDTO(&items[i]))
		}
		return result, total, nil
	}
}

// UrgeTicket creates an urge record for a pending ticket.
// Only the applicant can urge. Minimum interval: 30 minutes.
func UrgeTicket(ctx context.Context, ticketID, userID string) (*DTO, error) {
	if ticketID == "" || userID == "" {
		return nil, ErrInvalidInput
	}

	t, err := GetTicketByID(ctx, ticketID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if t.Status != StatusPending {
		return nil, ErrAlreadyActioned
	}

	if t.ApplicantID != userID {
		return nil, ErrForbidden
	}

	// Check minimum interval: 30 minutes since last urge
	lastUrge, err := GetLastUrgeTime(ctx, ticketID)
	if err != nil {
		return nil, err
	}
	if lastUrge != nil && time.Since(*lastUrge) < 30*time.Minute {
		return nil, fmt.Errorf("催办间隔至少 30 分钟，请稍后再试")
	}

	// Create urge record
	record := &ApprovalRecord{
		TicketID:   ticketID,
		ApproverID: userID,
		Action:     "urged",
		Comment:    "",
	}
	if err := CreateApprovalRecord(ctx, record); err != nil {
		return nil, err
	}

	// Send webhook for ticket.urged
	webhook.SendWebhook(ctx, "ticket.urged", map[string]interface{}{
		"ticket_id":    t.ID,
		"project_id":   t.ProjectID,
		"applicant_id": t.ApplicantID,
		"status":       t.Status,
	})

	return ToDTO(t), nil
}

// ResubmitTicket creates a new ticket from a rejected one.
// The original ticket stays rejected. The new ticket inherits project, approval mode, approver config.
func ResubmitTicket(ctx context.Context, originalTicketID, userID string, title, description, instructionJSON string) (*DTO, error) {
	if originalTicketID == "" || userID == "" || instructionJSON == "" {
		return nil, ErrInvalidInput
	}

	original, err := GetTicketByID(ctx, originalTicketID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if original.Status != StatusRejected {
		return nil, ErrAlreadyActioned
	}

	if original.ApplicantID != userID {
		return nil, ErrForbidden
	}

	if title == "" {
		title = original.Title
	}
	if description == "" {
		description = original.Description
	}

	// Create new ticket inheriting from original
	t := &Ticket{
		ProjectID:       original.ProjectID,
		ApplicantID:     userID,
		Title:           title,
		Description:     description,
		InstructionJSON: instructionJSON,
		Status:          StatusPending,
		ApprovalMode:    original.ApprovalMode,
	}
	if err := Create(ctx, t); err != nil {
		return nil, err
	}

	// Send webhook for ticket.created
	webhook.SendWebhook(ctx, "ticket.created", map[string]interface{}{
		"ticket_id":        t.ID,
		"project_id":       t.ProjectID,
		"applicant_id":     t.ApplicantID,
		"status":           t.Status,
		"resubmitted_from": originalTicketID,
	})

	return ToDTO(t), nil
}

// executeESWrite 执行 ES 写操作（在工单审批后调用）
func executeESWrite(ctx context.Context, client *elasticsearch.Client, inst pipeline.Instruction) error {
	parts := strings.Fields(inst.Raw)
	if len(parts) < 2 {
		return fmt.Errorf("invalid es command: %s", inst.Raw)
	}
	method := strings.ToUpper(parts[0])
	path := parts[1]

	var body io.Reader
	if len(parts) > 2 {
		idx := strings.Index(inst.Raw, " ")
		secondSpace := strings.Index(inst.Raw[idx+1:], " ")
		if secondSpace > 0 {
			body = strings.NewReader(inst.Raw[idx+1+secondSpace+1:])
		}
	}

	req, err := http.NewRequestWithContext(ctx, method, path, body)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := client.Transport.Perform(req)
	if err != nil {
		return fmt.Errorf("es request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("es error HTTP %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func splitSQL(sql string) []string {
	var result []string
	parts := strings.Split(sql, ";")
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}
