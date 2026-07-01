package sqlexec

import (
	"time"

	"gorm.io/gorm"
)

const (
	StatusPending  = "pending"
	StatusRunning  = "running"
	StatusSuccess  = "success"
	StatusFailed   = "failed"
	StatusRejected = "rejected"
)

type SqlExecution struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	ProjectID      uint           `gorm:"not null;index" json:"project_id"`
	Sql            string         `gorm:"type:text;not null" json:"sql"`
	Statements     string         `gorm:"type:text" json:"statements"` // JSON array of individual statements
	Classification string         `gorm:"size:64" json:"classification"`
	Status         string         `gorm:"size:32;not null;default:pending" json:"status"`
	RowCount       int            `gorm:"default:0" json:"row_count"`
	AffectedRows   int            `gorm:"default:0" json:"affected_rows"`
	DurationMs     int            `gorm:"default:0" json:"duration_ms"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}
