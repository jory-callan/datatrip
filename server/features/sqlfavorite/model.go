package sqlfavorite

import (
	"time"
)

const (
	ScopePersonal = "personal"
	ScopeTeam     = "team"
)

type SqlFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	Name      string    `gorm:"size:256;not null" json:"name"`
	Sql       string    `gorm:"type:text;not null" json:"sql"`
	Scope     string    `gorm:"size:32;not null;default:personal" json:"scope"`
	ProjectID uint      `gorm:"default:0" json:"project_id"`
	Database  string    `gorm:"size:128" json:"database"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (SqlFavorite) TableName() string {
	return "sql_favorites"
}
