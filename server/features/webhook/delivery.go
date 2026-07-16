package webhook

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// DeliveryLog Webhook 投递日志
type DeliveryLog struct {
	ID         string    `gorm:"primaryKey;size:32" json:"id"`     // 主键 UUID v7
	WebhookID  string    `gorm:"not null;index" json:"webhook_id"` // 关联 Webhook ID
	Event      string    `gorm:"size:64;not null" json:"event"`    // 触发的事件类型
	URL        string    `gorm:"size:1024;not null" json:"url"`    // 回调地址
	Status     string    `gorm:"size:32;not null" json:"status"`   // 投递状态: success-成功, failed-失败
	StatusCode int       `gorm:"default:0" json:"status_code"`     // HTTP 响应状态码
	DurationMs int       `gorm:"default:0" json:"duration_ms"`     // 投递耗时（毫秒）
	ErrorMsg   string    `gorm:"type:text" json:"error_msg"`       // 错误信息
	CreatedAt  time.Time `json:"created_at"`                       // 创建时间
}

// TableName 返回带前缀的表名
func (DeliveryLog) TableName() string {
	return "data_webhook_delivery_log"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (d *DeliveryLog) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = idutil.ShortUUIDv7()
	}
	return nil
}
