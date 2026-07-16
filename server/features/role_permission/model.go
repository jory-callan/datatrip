package rolepermission

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// RolePermission 角色权限关联
type RolePermission struct {
	ID           string         `gorm:"primaryKey;size:32" json:"id"`                                    // 主键 UUID v7
	RoleID       string         `gorm:"size:32;not null;index:idx_role_permission" json:"role_id"`       // 角色 ID
	PermissionID string         `gorm:"size:32;not null;index:idx_role_permission" json:"permission_id"` // 权限码 ID
	CreatedAt    time.Time      `json:"created_at"`                                                      // 创建时间
	UpdatedAt    time.Time      `json:"updated_at"`                                                      // 更新时间
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`                                                  // 软删除时间
}

// TableName 返回带前缀的表名
func (RolePermission) TableName() string {
	return "sys_role_permission"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (rp *RolePermission) BeforeCreate(tx *gorm.DB) error {
	if rp.ID == "" {
		rp.ID = idutil.ShortUUIDv7()
	}
	return nil
}
