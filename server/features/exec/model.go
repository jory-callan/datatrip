package exec

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	StatusPending  = "pending"
	StatusRunning  = "running"
	StatusSuccess  = "success"
	StatusFailed   = "failed"
	StatusRejected = "rejected"
)

// SqlExecution SQL 执行记录
type SqlExecution struct {
	ID             string         `gorm:"primaryKey;size:32" json:"id"`                   // 主键 UUID v7
	ProjectID      string         `gorm:"not null;index" json:"project_id"`               // 所属项目 ID
	Sql            string         `gorm:"type:text;not null" json:"sql"`                  // 原始 SQL
	Statements     string         `gorm:"type:text" json:"statements"`                    // 拆分后的单条语句（JSON 数组）
	Classification string         `gorm:"size:64" json:"classification"`                  // 分类: select / insert / update / delete / ddl / other
	Status         string         `gorm:"size:32;not null;default:pending" json:"status"` // 执行状态: pending-待执行, running-执行中, success-成功, failed-失败, rejected-已拒绝
	RowCount       int            `gorm:"default:0" json:"row_count"`                     // 查询返回行数
	AffectedRows   int            `gorm:"default:0" json:"affected_rows"`                 // 影响行数
	DurationMs     int            `gorm:"default:0" json:"duration_ms"`                   // 执行耗时（毫秒）
	CreatedAt      time.Time      `json:"created_at"`                                     // 创建时间
	UpdatedAt      time.Time      `json:"updated_at"`                                     // 更新时间
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`                                 // 软删除时间
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (s *SqlExecution) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// TableName 返回带前缀的表名
func (SqlExecution) TableName() string {
	return "data_sql_execution"
}
