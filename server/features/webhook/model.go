package webhook

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	EventTicketCreated           = "ticket.created"
	EventTicketApproved          = "ticket.approved"
	EventTicketPartiallyApproved = "ticket.partially_approved"
	EventTicketRejected          = "ticket.rejected"
	EventTicketExecuted          = "ticket.executed"
	EventTicketExecutionFailed   = "ticket.execution_failed"
	EventTicketUrged             = "ticket.urged"
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

// Webhook Webhook 通知配置
type Webhook struct {
	ID        string         `gorm:"primaryKey;size:32" json:"id"`                 // 主键 UUID v7
	Name      string         `gorm:"size:128;not null" json:"name"`                // Webhook 名称
	Scope     string         `gorm:"size:32;not null;default:global" json:"scope"` // 作用范围: global-全局, project-项目级
	ProjectID string         `gorm:"default:0" json:"project_id"`                  // 关联项目 ID（scope=project 时有效）
	URL       string         `gorm:"size:1024;not null" json:"url"`                // 回调地址
	Enabled   bool           `gorm:"not null;default:true" json:"enabled"`         // 是否启用
	Events    string         `gorm:"size:512;not null" json:"events"`              // 监听事件列表（逗号分隔），如: ticket.created,ticket.approved
	CreatedAt time.Time      `json:"created_at"`                                   // 创建时间
	UpdatedAt time.Time      `json:"updated_at"`                                   // 更新时间
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`                               // 软删除时间
}

// TableName 返回带前缀的表名
func (Webhook) TableName() string {
	return "data_webhook"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (w *Webhook) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" {
		w.ID = idutil.ShortUUIDv7()
	}
	return nil
}
