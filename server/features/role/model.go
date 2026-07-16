package role

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// Role 角色
type Role struct {
	ID          string         `gorm:"primaryKey;size:32" json:"id"`             // 主键 UUID v7
	Code        string         `gorm:"size:64;uniqueIndex;not null" json:"code"` // 角色编码，如 admin / developer / viewer
	Name        string         `gorm:"size:128;not null" json:"name"`            // 角色名称
	Description string         `gorm:"type:text" json:"description"`             // 角色描述
	IsSystem    bool           `gorm:"default:false" json:"is_system"`           // 是否系统内置（系统内置不可删除）
	CreatedAt   time.Time      `json:"created_at"`                               // 创建时间
	UpdatedAt   time.Time      `json:"updated_at"`                               // 更新时间
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`                           // 软删除时间
}

// TableName 返回带前缀的表名
func (Role) TableName() string {
	return "sys_role"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = idutil.ShortUUIDv7()
	}
	return nil
}
