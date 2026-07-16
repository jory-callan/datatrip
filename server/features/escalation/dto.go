package escalation

import (
	"time"
)

type DTO struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	ProjectID  string     `json:"project_id"`
	Reason     string     `json:"reason"`
	Status     string     `json:"status"`
	ExpiresAt  time.Time  `json:"expires_at"`
	ApprovedBy *string    `json:"approved_by,omitempty"`
	ApprovedAt *time.Time `json:"approved_at,omitempty"`
	RejectedBy *string    `json:"rejected_by,omitempty"`
	RejectedAt *time.Time `json:"rejected_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateRequest struct {
	ProjectID string `json:"project_id"`
	Reason    string `json:"reason"`
}

type ApproveRequest struct {
	Comment  string `json:"comment,omitempty"`
	Duration string `json:"duration,omitempty"` // optional: "24h", "7d", "30d", "1y"; default 1y
}

type UpdateRequest struct {
	Reason string `json:"reason"`
}

type BatchDeleteRequest struct {
	IDs []string `json:"ids"`
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
