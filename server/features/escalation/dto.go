package escalation

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID         uint       `json:"id"`
	UserID     uint       `json:"user_id"`
	ProjectID  uint       `json:"project_id"`
	Reason     string     `json:"reason"`
	Status     string     `json:"status"`
	ExpiresAt  time.Time  `json:"expires_at"`
	ApprovedBy *uint      `json:"approved_by,omitempty"`
	ApprovedAt *time.Time `json:"approved_at,omitempty"`
	RejectedBy *uint      `json:"rejected_by,omitempty"`
	RejectedAt *time.Time `json:"rejected_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateRequest struct {
	ProjectID uint   `json:"project_id"`
	Reason    string `json:"reason"`
}

type ApproveRequest struct {
	Comment  string `json:"comment,omitempty"`
	Duration string `json:"duration,omitempty"` // optional: "24h", "7d", "30d", "1y"; default 1y
}

type ListQuery struct {
	response.PageQuery
	Scope     string `query:"scope"` // my | pending | all
	ProjectID uint   `query:"project_id"`
	Status    string `query:"status"`
}

type ActiveResponse struct {
	Active     bool      `json:"active"`
	Escalation *DTO      `json:"escalation,omitempty"`
	ExpiresAt  time.Time `json:"expires_at,omitempty"`
}

func ToDTO(e *Escalation) *DTO {
	return &DTO{
		ID:         e.ID,
		UserID:     e.UserID,
		ProjectID:  e.ProjectID,
		Reason:     e.Reason,
		Status:     e.Status,
		ExpiresAt:  e.ExpiresAt,
		ApprovedBy: e.ApprovedBy,
		ApprovedAt: e.ApprovedAt,
		RejectedBy: e.RejectedBy,
		RejectedAt: e.RejectedAt,
		CreatedAt:  e.CreatedAt,
	}
}
