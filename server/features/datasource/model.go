package datasource

import (
	"time"

	"gorm.io/gorm"
)

const (
	StatusConnected    = "connected"
	StatusDisconnected = "disconnected"
	StatusError        = "error"

	TypeMySQL      = "mysql"
	TypePostgreSQL = "postgresql"
)

type Datasource struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:128;not null" json:"name"`
	Type      string         `gorm:"size:32;not null" json:"type"`
	Host      string         `gorm:"size:256;not null" json:"host"`
	Port      int            `gorm:"not null" json:"port"`
	Username  string         `gorm:"size:128;not null" json:"username"`
	Password  string         `gorm:"size:256;not null" json:"-"`
	Database  string         `gorm:"size:128" json:"-"`
	Remark    string         `gorm:"size:512" json:"remark"`
	Status    string         `gorm:"size:32;not null;default:disconnected" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// WithStatus returns a copy with the status field updated.
func (d *Datasource) WithStatus(s string) *Datasource {
	d.Status = s
	return d
}
