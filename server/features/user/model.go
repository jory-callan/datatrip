package user

import (
	"time"

	"gorm.io/gorm"
)

const (
	StatusActive   = "active"
	StatusDisabled = "disabled"
)

// 角色码常量
const (
	RoleSystemAdmin  = "system_admin"
	RoleProjectOwner = "project_owner"
	RoleDeveloper    = "developer"
	RoleViewer       = "viewer"
	RoleApprover     = "approver"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:64;not null" json:"username"`
	PasswordHash string         `gorm:"size:255;not null" json:"-"`
	Nickname     string         `gorm:"size:64" json:"nickname"`
	RoleCode     string         `gorm:"size:64;not null;default:viewer" json:"role_code"`
	Status       string         `gorm:"size:32;not null;default:active" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// IsSystemAdmin 是否为系统管理员
func (u *User) IsSystemAdmin() bool {
	return u.RoleCode == RoleSystemAdmin
}
