package user

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	StatusActive   = "active"
	StatusDisabled = "disabled"
)

// User 用户账号
type User struct {
	ID           string         `gorm:"primaryKey;size:32" json:"id"`                  // 主键 UUID v7
	Username     string         `gorm:"uniqueIndex;size:64;not null" json:"username"`  // 登录用户名
	PasswordHash string         `gorm:"size:255;not null" json:"-"`                    // 密码哈希（bcrypt）
	Nickname     string         `gorm:"size:64" json:"nickname"`                       // 显示昵称
	Email        string         `gorm:"size:128" json:"email"`                         // 电子邮箱
	Phone        string         `gorm:"size:32" json:"phone"`                          // 手机号
	Status       string         `gorm:"size:32;not null;default:active" json:"status"` // 状态: active-正常, disabled-停用
	CreatedAt    time.Time      `json:"created_at"`                                    // 创建时间
	UpdatedAt    time.Time      `json:"updated_at"`                                    // 更新时间
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`                                // 软删除时间
}

// TableName 返回带前缀的表名
func (User) TableName() string {
	return "sys_user"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = idutil.ShortUUIDv7()
	}
	return nil
}
