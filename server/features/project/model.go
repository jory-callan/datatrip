package project

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	ApprovalModeAnyOne = "any_one"
	ApprovalModeAll    = "all"

	MemberRoleViewer    = "viewer"
	MemberRoleDeveloper = "developer"
	MemberRoleApprover  = "approver"
	MemberRoleAdmin     = "admin"
)

// DataProject 项目（数据操作工作空间）
type DataProject struct {
	ID           string         `gorm:"primaryKey;size:32" json:"id"`                          // 主键 UUID v7
	Name         string         `gorm:"size:128;not null" json:"name"`                         // 项目名称
	DatasourceID string         `gorm:"not null;index" json:"datasource_id"`                   // 关联数据源 ID
	Scope        string         `gorm:"type:text" json:"scope"`                                // 资源范围（JSON 数组字符串），按数据源类型决定语义：SQL→库名列表，Redis→db number，Mongo→database，ES→index pattern
	ApprovalMode string         `gorm:"size:32;not null;default:any_one" json:"approval_mode"` // 审批模式: any_one-任意一人通过, all-全部通过
	WebhookIDs   string         `gorm:"size:1024" json:"webhook_ids"`                          // 关联 Webhook ID 列表（逗号分隔）
	CreatedAt    time.Time      `json:"created_at"`                                            // 创建时间
	UpdatedAt    time.Time      `json:"updated_at"`                                            // 更新时间
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`                                        // 软删除时间
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (p *DataProject) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// TableName 返回带前缀的表名
func (DataProject) TableName() string {
	return "data_project"
}

// DataProjectMember 项目成员
type DataProjectMember struct {
	ID        string         `gorm:"primaryKey;size:32" json:"id"`     // 主键 UUID v7
	ProjectID string         `gorm:"not null;index" json:"project_id"` // 所属项目 ID
	UserID    string         `gorm:"not null;index" json:"user_id"`    // 用户 ID
	Role      string         `gorm:"size:32;not null" json:"role"`     // 角色: viewer-访客, developer-开发者, approver-审批人, admin-项目管理员
	CreatedAt time.Time      `json:"created_at"`                       // 创建时间
	UpdatedAt time.Time      `json:"updated_at"`                       // 更新时间
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`                   // 软删除时间
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (m *DataProjectMember) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// TableName 返回带前缀的表名
func (DataProjectMember) TableName() string {
	return "data_project_member"
}
