package permission

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// Permission 权限码
type Permission struct {
	ID          string         `gorm:"primaryKey;size:32" json:"id"`              // 主键 UUID v7
	Code        string         `gorm:"size:128;uniqueIndex;not null" json:"code"` // 权限编码，三段式: service:resource:action（如 ticket:sql:execute）
	Name        string         `gorm:"size:128;not null" json:"name"`             // 权限名称
	Description string         `gorm:"type:text" json:"description"`              // 权限描述
	Module      string         `gorm:"size:64;index" json:"module"`               // 所属模块: user / ticket / datasource / system 等
	IsSystem    bool           `gorm:"default:false" json:"is_system"`            // 是否系统内置（系统内置不可删除）
	CreatedAt   time.Time      `json:"created_at"`                                // 创建时间
	UpdatedAt   time.Time      `json:"updated_at"`                                // 更新时间
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`                            // 软删除时间
}

// TableName 返回带前缀的表名
func (Permission) TableName() string {
	return "sys_permission"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = idutil.ShortUUIDv7()
	}
	return nil
}
