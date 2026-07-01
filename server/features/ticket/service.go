package ticket

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/user"
	"czwlinux.cloud/go-friday-starter/features/webhook"
	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/dbpool"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	ErrNotFound       = errors.New("ticket not found")
	ErrInvalidInput   = errors.New("invalid input")
	ErrForbidden      = errors.New("forbidden")
	ErrAlreadyActioned = errors.New("ticket already actioned")
)

// CreateTicket creates a new pending ticket.
func CreateTicket(ctx context.Context, projectID, applicantID uint, title, description, sqlSnapshot, approvalMode string) (*DTO, error) {
	if projectID == 0 || applicantID == 0 || sqlSnapshot == "" {
		return nil, ErrInvalidInput
	}
	if approvalMode == "" {
		approvalMode = project.ApprovalModeAnyOne
	}
	if approvalMode != project.ApprovalModeAnyOne && approvalMode != project.ApprovalModeAll {
		return nil, ErrInvalidInput
	}

	// If project has auto_match_approver, sync approver_ids from project_owner members
	proj, err := project.GetByID(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}
	if proj.AutoMatchApprover {
		ownerIDs, err := project.GetProjectOwnerIDs(ctx, projectID)
		if err != nil {
			return nil, fmt.Errorf("get project owners failed: %w", err)
		}
		proj.ApproverIDs = project.JoinIDs(ownerIDs)
		if err := project.Save(ctx, proj); err != nil {
			return nil, fmt.Errorf("save project approvers failed: %w", err)
		}
	}

	t := &Ticket{
		ProjectID:    projectID,
		ApplicantID:  applicantID,
		Title:        title,
		Description:  description,
		SqlSnapshot:  sqlSnapshot,
		Status:       StatusPending,
		ApprovalMode: approvalMode,
	}
	if err := Create(ctx, t); err != nil {
		return nil, err
	}

	// Send webhook for ticket.created
	webhook.SendWebhook(ctx, "ticket.created", map[string]interface{}{
		"ticket_id": t.ID,
		"project_id": projectID,
		"applicant_id": applicantID,
		"status": t.Status,
	})

	return ToDTO(t), nil
}

// ApproveTicket approves a ticket. Checks approval mode and auto-executes if condition met.
// project_owner can bypass approver list.
func ApproveTicket(ctx context.Context, ticketID, approverID uint, comment string) (*DTO, error) {
	if ticketID == 0 || approverID == 0 {
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

	// Check if user can approve: must be project_owner or approver or system_admin
	userRole := project.GetUserProjectRole(ctx, t.ProjectID, approverID)
	isProjectOwner := userRole == project.MemberRoleProjectOwner
	isSystemAdmin := false

	u, err := user.GetByID(ctx, approverID)
	if err == nil {
		isSystemAdmin = u.IsSystemAdmin()
	}

	// Check if user is in project's approver list
	proj, err := project.GetByID(ctx, t.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	// Parse approver IDs from project
	approverIDs := parseApproverIDs(proj.ApproverIDs)
	isApprover := false
	for _, id := range approverIDs {
		if id == approverID {
			isApprover = true
			break
		}
	}

	if !isApprover && !isProjectOwner && !isSystemAdmin {
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
				"ticket_id": t.ID,
				"project_id": t.ProjectID,
				"approver_id": approverID,
				"status": t.Status,
			})

			// Auto-execute
			if err := ExecuteTicket(ctx, ticketID); err != nil {
				global.Log.Error("auto-execute ticket failed", zap.Uint("ticket_id", ticketID), zap.Error(err))
			}
		} else {
			// all mode: not all approvers yet — keep as pending
			webhook.SendWebhook(ctx, "ticket.partially_approved", map[string]interface{}{
				"ticket_id": t.ID,
				"project_id": t.ProjectID,
				"approver_id": approverID,
				"status": t.Status,
			})
		}

	return ToDTO(t), nil
}

// RejectTicket rejects a ticket.
func RejectTicket(ctx context.Context, ticketID, approverID uint, comment string) (*DTO, error) {
	if ticketID == 0 || approverID == 0 {
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
	userRole := project.GetUserProjectRole(ctx, t.ProjectID, approverID)
	isProjectOwner := userRole == project.MemberRoleProjectOwner
	isSystemAdmin := false
	u, err := user.GetByID(ctx, approverID)
	if err == nil {
		isSystemAdmin = u.IsSystemAdmin()
	}

	proj, err := project.GetByID(ctx, t.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	approverIDs := parseApproverIDs(proj.ApproverIDs)
	isApprover := false
	for _, id := range approverIDs {
		if id == approverID {
			isApprover = true
			break
		}
	}

	if !isApprover && !isProjectOwner && !isSystemAdmin {
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
		"ticket_id": t.ID,
		"project_id": t.ProjectID,
		"approver_id": approverID,
		"status": t.Status,
	})

	return ToDTO(t), nil
}

// ExecuteTicket executes the SQL snapshot against the datasource.
func ExecuteTicket(ctx context.Context, ticketID uint) error {
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

	// Get project
	proj, err := project.GetByID(ctx, t.ProjectID)
	if err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	t.Status = StatusExecuting
	if err := SaveTicket(ctx, t); err != nil {
		return err
	}

	start := time.Now()

	// Get db connection
	pool, err := dbpool.Get(ctx, proj.DatasourceID)
	if err != nil {
		t.Status = StatusExecuteFailed
		_ = SaveTicket(ctx, t)

		// Audit log for failure
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:       t.ApplicantID,
			ProjectID:     t.ProjectID,
			DatasourceID:  proj.DatasourceID,
			Action:        "ticket_execute",
			Sql:           t.SqlSnapshot,
			Classification: "write",
			Status:        audit.StatusFailed,
			ErrorMessage:  fmt.Sprintf("get db connection failed: %v", err),
			TicketID:      t.ID,
		})

		webhook.SendWebhook(ctx, "ticket.execution_failed", map[string]interface{}{
			"ticket_id": t.ID,
			"project_id": t.ProjectID,
			"error": err.Error(),
		})

		return fmt.Errorf("get db connection failed: %w", err)
	}

	// Execute SQL (multi-statement)
	statements := splitSQL(t.SqlSnapshot)
	execErrStr := ""
	for i, stmt := range statements {
		if strings.TrimSpace(stmt) == "" {
			continue
		}
		_, execErr := pool.ExecContext(ctx, stmt)
		if execErr != nil {
			if i == 0 {
				execErrStr = execErr.Error()
			} else {
				execErrStr += "; " + execErr.Error()
			}
		}
	}

	duration := int(time.Since(start).Milliseconds())

	if execErrStr != "" {
		t.Status = StatusExecuteFailed
		t.ExecutionStatus = "failed"
		t.ExecutionError = execErrStr
		now := time.Now()
		t.ExecutedAt = &now
		_ = SaveTicket(ctx, t)

		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:       t.ApplicantID,
			ProjectID:     t.ProjectID,
			DatasourceID:  proj.DatasourceID,
			Action:        "ticket_execute",
			Sql:           t.SqlSnapshot,
			Classification: "write",
			Status:        audit.StatusFailed,
			ErrorMessage:  execErrStr,
			DurationMs:    duration,
			TicketID:      t.ID,
		})

		webhook.SendWebhook(ctx, "ticket.execution_failed", map[string]interface{}{
			"ticket_id": t.ID,
			"project_id": t.ProjectID,
			"error": execErrStr,
		})

		return fmt.Errorf("execution failed: %s", execErrStr)
	}

	t.Status = StatusExecuted
	t.ExecutionStatus = "success"
	now := time.Now()
	t.ExecutedAt = &now
	if err := SaveTicket(ctx, t); err != nil {
		return err
	}

	audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
		ActorID:       t.ApplicantID,
		ProjectID:     t.ProjectID,
		DatasourceID:  proj.DatasourceID,
		Action:        "ticket_execute",
		Sql:           t.SqlSnapshot,
		Classification: "write",
		Status:        audit.StatusSuccess,
		DurationMs:    duration,
		TicketID:      t.ID,
	})

	webhook.SendWebhook(ctx, "ticket.executed", map[string]interface{}{
		"ticket_id": t.ID,
		"project_id": t.ProjectID,
		"status": t.Status,
		"duration_ms": duration,
	})

	return nil
}

// GetTicketDetail returns ticket + approvals + related audit logs.
func GetTicketDetail(ctx context.Context, ticketID uint) (*TicketDetail, error) {
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
func ListTicketsForUser(ctx context.Context, userID uint, query ListQuery) ([]*DTO, int64, error) {
	query.Normalize()

	switch query.Scope {
	case "my":
		items, total, err := ListTicketsByApplicant(ctx, userID, query)
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
		// Get all projects where user is a member with approver access
		query.Status = StatusPending
		items, total, err := ListTickets(ctx, query)
		if err != nil {
			return nil, 0, err
		}
		result := make([]*DTO, 0, len(items))
		for i := range items {
			result = append(result, ToDTO(&items[i]))
		}
		return result, total, nil
	default:
		items, total, err := ListTickets(ctx, query)
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

// Helper: parse comma-separated approver IDs
func parseApproverIDs(s string) []uint {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	var ids []uint
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		id, err := strconv.ParseUint(p, 10, 64)
		if err != nil {
			continue
		}
		ids = append(ids, uint(id))
	}
	return ids
}

// UrgeTicket creates an urge record for a pending ticket.
// Only the applicant can urge. Minimum interval: 30 minutes.
func UrgeTicket(ctx context.Context, ticketID, userID uint) (*DTO, error) {
	if ticketID == 0 || userID == 0 {
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
		"ticket_id":   t.ID,
		"project_id":  t.ProjectID,
		"applicant_id": t.ApplicantID,
		"status":      t.Status,
	})

	return ToDTO(t), nil
}
// ResubmitTicket creates a new ticket from a rejected one.
// The original ticket stays rejected. The new ticket inherits project, approval mode, approver config.
func ResubmitTicket(ctx context.Context, originalTicketID, userID uint, title, description, sqlSnapshot string) (*DTO, error) {
	if originalTicketID == 0 || userID == 0 || sqlSnapshot == "" {
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
		ProjectID:    original.ProjectID,
		ApplicantID:  userID,
		Title:        title,
		Description:  description,
		SqlSnapshot:  sqlSnapshot,
		Status:       StatusPending,
		ApprovalMode: original.ApprovalMode,
	}
	if err := Create(ctx, t); err != nil {
		return nil, err
	}

	// Send webhook for ticket.created
	webhook.SendWebhook(ctx, "ticket.created", map[string]interface{}{
		"ticket_id":    t.ID,
		"project_id":   t.ProjectID,
		"applicant_id": t.ApplicantID,
		"status":       t.Status,
		"resubmitted_from": originalTicketID,
	})

	return ToDTO(t), nil
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
