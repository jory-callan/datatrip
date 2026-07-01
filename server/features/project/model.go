package project

import (
	"time"

	"gorm.io/gorm"
)

const (
	ApprovalModeAnyOne = "any_one"
	ApprovalModeAll    = "all"

	MemberRoleViewer       = "viewer"
	MemberRoleDeveloper    = "developer"
	MemberRoleProjectOwner = "project_owner"
)

type DbProject struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Name           string         `gorm:"size:128;not null" json:"name"`
	DatasourceID   uint           `gorm:"not null;index" json:"datasource_id"`
	Databases      string         `gorm:"size:1024" json:"databases"` // 逗号分隔
	ApprovalMode   string         `gorm:"size:32;not null;default:any_one" json:"approval_mode"`
	ApproverIDs    string         `gorm:"size:1024" json:"approver_ids"`     // 逗号分隔 user_id
	AutoMatchApprover bool        `gorm:"default:false" json:"auto_match_approver"` // 自动匹配审批人
	WebhookIDs     string         `gorm:"size:1024" json:"webhook_ids"`      // 逗号分隔 webhook id
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type ProjectMember struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProjectID uint      `gorm:"not null;index" json:"project_id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Role      string    `gorm:"size:32;not null" json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
