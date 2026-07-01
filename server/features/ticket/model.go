package ticket

import (
	"time"

	"gorm.io/gorm"
)

// Ticket status constants
const (
	StatusPending       = "pending"
	StatusApproved      = "approved"
	StatusRejected      = "rejected"
	StatusExecuting     = "executing"
	StatusExecuted      = "executed"
	StatusExecuteFailed = "execute_failed"
)

type Ticket struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ProjectID       uint           `gorm:"not null;index" json:"project_id"`
	ApplicantID     uint           `gorm:"not null;index" json:"applicant_id"`
	Title           string         `gorm:"size:256" json:"title"`
	Description     string         `gorm:"type:text" json:"description"`
	SqlSnapshot     string         `gorm:"type:text;not null" json:"sql_snapshot"`
	Status          string         `gorm:"size:32;not null;default:pending" json:"status"`
	ApprovalMode    string         `gorm:"size:32;not null;default:any_one" json:"approval_mode"`
	ExecutionStatus string         `gorm:"size:32" json:"execution_status"`          // success / failed
	ExecutionError  string         `gorm:"type:text" json:"execution_error"`           // error message if failed
	ExecutedAt      *time.Time     `json:"executed_at"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type ApprovalRecord struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	TicketID   uint      `gorm:"not null;index" json:"ticket_id"`
	ApproverID uint      `gorm:"not null;index" json:"approver_id"`
	Action     string    `gorm:"size:32;not null" json:"action"` // approved / rejected / urged
	Comment    string    `gorm:"type:text" json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

func (ApprovalRecord) TableName() string {
	return "approval_records"
}
