package datasource

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	StatusConnected    = "connected"
	StatusDisconnected = "disconnected"
	StatusError        = "error"

	TypeMySQL      = "mysql"
	TypePostgreSQL = "postgresql"
	TypeTiDB       = "tidb"
	TypeOceanBase  = "oceanbase"
	TypeMariaDB    = "mariadb"
	TypeRedis      = "redis"
	TypeMongoDB    = "mongo"
	TypeES         = "es"
	TypeKafka      = "kafka"
)

// Datasource 数据源连接配置
type Datasource struct {
	ID        string         `gorm:"primaryKey;size:32" json:"id"`                        // 主键 UUID v7
	Name      string         `gorm:"size:128;not null" json:"name"`                       // 数据源名称
	Type      string         `gorm:"size:32;not null" json:"type"`                        // 数据库类型: mysql / postgresql / redis / mongo
	TypeGroup string         `gorm:"size:32;not null;default:''" json:"type_group"`       // 类型分组: sql / nosql / search / mq，创建时自动填充
	Host      string         `gorm:"size:256;not null" json:"host"`                       // 主机地址
	Port      int            `gorm:"not null" json:"port"`                                // 端口号
	Username  string         `gorm:"size:128;not null" json:"username"`                   // 连接用户名
	Password  string         `gorm:"size:256;not null" json:"-"`                          // 连接密码（不返回前端）
	Database  string         `gorm:"size:128" json:"-"`                                   // 默认数据库（不返回前端）
	Remark    string         `gorm:"size:512" json:"remark"`                              // 备注说明
	Status    string         `gorm:"size:32;not null;default:disconnected" json:"status"` // 连接状态: connected-已连接, disconnected-未连接, error-异常
	CreatedAt time.Time      `json:"created_at"`                                          // 创建时间
	UpdatedAt time.Time      `json:"updated_at"`                                          // 更新时间
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`                                      // 软删除时间
}

// TableName 返回带前缀的表名
func (Datasource) TableName() string {
	return "data_datasource"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (d *Datasource) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// WithStatus returns a copy with the status field updated.
func (d *Datasource) WithStatus(s string) *Datasource {
	d.Status = s
	return d
}
