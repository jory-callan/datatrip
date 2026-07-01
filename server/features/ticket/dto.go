package ticket

import (
	"time"

	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID              uint       `json:"id"`
	ProjectID       uint       `json:"project_id"`
	ApplicantID     uint       `json:"applicant_id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	SqlSnapshot     string     `json:"sql_snapshot"`
	Status          string     `json:"status"`
	ApprovalMode    string     `json:"approval_mode"`
	ExecutionStatus string     `json:"execution_status"`
	ExecutionError  string     `json:"execution_error"`
	ExecutedAt      *time.Time `json:"executed_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type ApprovalRecordDTO struct {
	ID         uint      `json:"id"`
	TicketID   uint      `json:"ticket_id"`
	ApproverID uint      `json:"approver_id"`
	Action     string    `json:"action"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

type TicketDetail struct {
	Ticket    *DTO                 `json:"ticket"`
	Approvals []*ApprovalRecordDTO `json:"approvals"`
	Audits    []*audit.DTO         `json:"audits"`
}

type ListQuery struct {
	response.PageQuery
	Scope     string `query:"scope" json:"scope"`           // my | pending | all
	Status    string `query:"status" json:"status"`
	ProjectID uint   `query:"project_id" json:"project_id"`
}

type ApproveRequest struct {
	Comment string `json:"comment"`
}

type CreateTicketRequest struct {
	ProjectID    uint   `json:"project_id"`
	SqlSnapshot  string `json:"sql_snapshot"`
	ApprovalMode string `json:"approval_mode"`
	Title        string `json:"title"`
	Description  string `json:"description"`
}

func ToDTO(t *Ticket) *DTO {
	if t == nil {
		return nil
	}
	return &DTO{
		ID:              t.ID,
		ProjectID:       t.ProjectID,
		ApplicantID:     t.ApplicantID,
		Title:           t.Title,
		Description:     t.Description,
		SqlSnapshot:     t.SqlSnapshot,
		Status:          t.Status,
		ApprovalMode:    t.ApprovalMode,
		ExecutionStatus: t.ExecutionStatus,
		ExecutionError:  t.ExecutionError,
		ExecutedAt:      t.ExecutedAt,
		CreatedAt:       t.CreatedAt,
		UpdatedAt:       t.UpdatedAt,
	}
}

func ToApprovalRecordDTO(a *ApprovalRecord) *ApprovalRecordDTO {
	if a == nil {
		return nil
	}
	return &ApprovalRecordDTO{
		ID:         a.ID,
		TicketID:   a.TicketID,
		ApproverID: a.ApproverID,
		Action:     a.Action,
		Comment:    a.Comment,
		CreatedAt:  a.CreatedAt,
	}
}
