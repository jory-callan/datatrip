package snippet

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// Snippet 代码片段收藏
type Snippet struct {
	ID             string         `gorm:"primaryKey;size:32" json:"id"`            // 主键 UUID v7
	UserID         string         `gorm:"not null;index" json:"user_id"`           // 所属用户 ID
	Name           string         `gorm:"size:256;not null" json:"name"`           // 片段名称
	Content        string         `gorm:"type:text;not null" json:"content"`       // 代码内容
	DatasourceType string         `gorm:"size:32;not null" json:"datasource_type"` // 数据源类型：mysql/redis/mongo/es
	CreatedAt      time.Time      `json:"created_at"`                              // 创建时间
	UpdatedAt      time.Time      `json:"updated_at"`                              // 更新时间
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (s *Snippet) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = idutil.ShortUUIDv7()
	}
	return nil
}

func (Snippet) TableName() string {
	return "data_snippet"
}
