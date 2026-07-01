package webhook

import (
	"time"

	"gorm.io/gorm"
)

const (
	EventTicketCreated         = "ticket.created"
	EventTicketApproved        = "ticket.approved"
	EventTicketPartiallyApproved = "ticket.partially_approved"
	EventTicketRejected        = "ticket.rejected"
	EventTicketExecuted        = "ticket.executed"
	EventTicketExecutionFailed = "ticket.execution_failed"
	EventTicketUrged           = "ticket.urged"
)

var AllEvents = []string{
	EventTicketCreated,
	EventTicketApproved,
	EventTicketPartiallyApproved,
	EventTicketRejected,
	EventTicketExecuted,
	EventTicketExecutionFailed,
	EventTicketUrged,
}

const (
	ScopeGlobal  = "global"
	ScopeProject = "project"
)

type Webhook struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:128;not null" json:"name"`
	Scope     string         `gorm:"size:32;not null;default:global" json:"scope"`
	ProjectID uint           `gorm:"default:0" json:"project_id"`
	URL       string         `gorm:"size:1024;not null" json:"url"`
	Enabled   bool           `gorm:"not null;default:true" json:"enabled"`
	Events    string         `gorm:"size:512;not null" json:"events"` // comma-separated
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
