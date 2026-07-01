package escalation

import (
	"time"

	"gorm.io/gorm"
)

const (
	StatusPending  = "pending"
	StatusApproved = "approved"
	StatusRejected = "rejected"
	StatusExpired  = "expired"

	MaxDuration = 365 * 24 * time.Hour // 1 year
)

type Escalation struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null;index" json:"user_id"`
	ProjectID   uint           `gorm:"not null;index" json:"project_id"`
	Reason      string         `gorm:"type:text;not null" json:"reason"`
	Status      string         `gorm:"size:32;not null;default:pending" json:"status"`
	ExpiresAt   time.Time      `gorm:"not null" json:"expires_at"`
	ApprovedBy  *uint          `gorm:"index" json:"approved_by,omitempty"`
	ApprovedAt  *time.Time     `json:"approved_at,omitempty"`
	RejectedBy  *uint          `gorm:"index" json:"rejected_by,omitempty"`
	RejectedAt  *time.Time     `json:"rejected_at,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Escalation) TableName() string {
	return "escalations"
}
