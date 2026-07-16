package userrole

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// UserRole 用户角色关联
type UserRole struct {
	ID        string         `gorm:"primaryKey;size:32" json:"id"`                        // 主键 UUID v7
	UserID    string         `gorm:"size:32;not null;index:idx_user_role" json:"user_id"` // 用户 ID
	RoleID    string         `gorm:"size:32;not null;index:idx_user_role" json:"role_id"` // 角色 ID
	CreatedAt time.Time      `json:"created_at"`                                          // 创建时间
	UpdatedAt time.Time      `json:"updated_at"`                                          // 更新时间
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`                                      // 软删除时间
}

// TableName 返回带前缀的表名
func (UserRole) TableName() string {
	return "sys_user_role"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (u *UserRole) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = idutil.ShortUUIDv7()
	}
	return nil
}
