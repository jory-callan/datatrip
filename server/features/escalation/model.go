package escalation

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	StatusPending  = "pending"
	StatusApproved = "approved"
	StatusRejected = "rejected"
	StatusExpired  = "expired"

	MaxDuration = 365 * 24 * time.Hour
)

// Escalation 权限升级申请（临时提权）
type Escalation struct {
	ID         string         `gorm:"primaryKey;size:32" json:"id"`                   // 主键 UUID v7
	UserID     string         `gorm:"size:32;not null;index" json:"user_id"`          // 申请人用户 ID
	ProjectID  string         `gorm:"size:32;not null;index" json:"project_id"`       // 申请项目 ID
	Reason     string         `gorm:"type:text;not null" json:"reason"`               // 申请理由
	Status     string         `gorm:"size:32;not null;default:pending" json:"status"` // 申请状态: pending-待审批, approved-已通过, rejected-已拒绝, expired-已过期
	ExpiresAt  time.Time      `gorm:"not null" json:"expires_at"`                     // 过期时间
	ApprovedBy *string        `gorm:"size:32;index" json:"approved_by,omitempty"`     // 审批人用户 ID
	ApprovedAt *time.Time     `json:"approved_at,omitempty"`                          // 审批时间
	RejectedBy *string        `gorm:"size:32;index" json:"rejected_by,omitempty"`     // 拒绝人用户 ID
	RejectedAt *time.Time     `json:"rejected_at,omitempty"`                          // 拒绝时间
	CreatedAt  time.Time      `json:"created_at"`                                     // 创建时间
	UpdatedAt  time.Time      `json:"updated_at"`                                     // 更新时间
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`                                 // 软删除时间
}

// TableName 返回带前缀的表名
func (Escalation) TableName() string {
	return "data_escalation"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (e *Escalation) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = idutil.ShortUUIDv7()
	}
	return nil
}
