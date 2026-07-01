package webhook

import (
	"time"
)

type DeliveryLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	WebhookID   uint      `gorm:"not null;index" json:"webhook_id"`
	Event       string    `gorm:"size:64;not null" json:"event"`
	URL         string    `gorm:"size:1024;not null" json:"url"`
	Status      string    `gorm:"size:32;not null" json:"status"` // success / failed
	StatusCode  int       `gorm:"default:0" json:"status_code"`
	DurationMs  int       `gorm:"default:0" json:"duration_ms"`
	ErrorMsg    string    `gorm:"type:text" json:"error_msg"`
	CreatedAt   time.Time `json:"created_at"`
}

func (DeliveryLog) TableName() string {
	return "webhook_delivery_logs"
}
