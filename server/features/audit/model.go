package audit

import "time"

// Status constants for audit logs
const (
	StatusPending  = "pending"
	StatusRunning  = "running"
	StatusSuccess  = "success"
	StatusFailed   = "failed"
	StatusRejected = "rejected"
)

type AuditLog struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ActorID        uint      `gorm:"not null;index" json:"actor_id"`
	ProjectID      uint      `gorm:"index" json:"project_id"`
	DatasourceID   uint      `gorm:"index" json:"datasource_id"`
	Action         string    `gorm:"size:64;not null" json:"action"`
	Sql            string    `gorm:"type:text" json:"sql"`
	Classification string    `gorm:"size:64" json:"classification"`
	Status         string    `gorm:"size:32;not null;default:pending" json:"status"`
	DurationMs     int       `gorm:"default:0" json:"duration_ms"`
	ErrorMessage   string    `gorm:"type:text" json:"error_message"`
	TicketID       uint      `gorm:"default:0" json:"ticket_id"`
	IP             string    `gorm:"size:64" json:"ip"`
	CreatedAt      time.Time `json:"created_at"`
}

// TableName overrides the default table name to use "audit_logs".
// gorm will pluralize AuditLog to audit_logs by default, but this is explicit.
func (AuditLog) TableName() string {
	return "audit_logs"
}
