package dsrule

import (
	"time"

	"gorm.io/gorm"
)

// Category constants
const (
	CategoryRead      = "read"
	CategoryWrite     = "write"
	CategoryDangerous = "dangerous"
)

type DatasourceRule struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:128;not null" json:"name"`
	DBType    string         `gorm:"size:32;not null;default:''" json:"db_type"`
	Category  string         `gorm:"size:32;not null" json:"category"`
	Pattern   string         `gorm:"size:1024;not null" json:"pattern"`
	Enabled   bool           `gorm:"not null;default:true" json:"enabled"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (DatasourceRule) TableName() string {
	return "ds_rule"
}
