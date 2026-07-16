package dsrule

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// Category constants
const (
	CategoryRead      = "read"      // 只读
	CategoryWrite     = "write"     // 可写
	CategoryDangerous = "dangerous" // 危险操作（如 DROP）
)

// DatasourceRule 数据源操作规则
type DatasourceRule struct {
	ID        string         `gorm:"primaryKey;size:32" json:"id"`                  // 主键 UUID v7
	Name      string         `gorm:"size:128;not null" json:"name"`                 // 规则名称
	TypeGroup string         `gorm:"size:32;not null;default:''" json:"type_group"` // 类型分组: ""(全部) / "sql" / "nosql" / "search" / "mq"
	TypeScope string         `gorm:"size:32;not null;default:''" json:"type_scope"` // 具体类型: ""(全部) / "mysql" / "redis" / "es"（留空则作用于整个分组）
	Category  string         `gorm:"size:32;not null" json:"category"`              // 规则分类: read-只读, write-可写, dangerous-危险
	Pattern   string         `gorm:"size:1024;not null" json:"pattern"`             // 匹配模式（正则表达式）
	Enabled   bool           `gorm:"not null;default:true" json:"enabled"`          // 是否启用
	Priority  int            `gorm:"not null;default:0" json:"priority"`            // 排序优先级，数字小优先
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 返回带前缀的表名
func (DatasourceRule) TableName() string {
	return "data_datasource_rule"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (r *DatasourceRule) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = idutil.ShortUUIDv7()
	}
	return nil
}
