// Package driver 提供数据源类型相关的连接、元数据、列类型等操作的接口和注册中心。
//
// 设计原则：
//   - 按 group 调度（SQL / NoSQL / Search / MQ），不搞万能抽象
//   - SQLConnector 是 SQL 族专用的接口，NoSQL/Search 各自独立
//   - 不存在 Connector 返回 any 的情况——调用端通过 type group 分流后拿到 typed 实现
//
// 使用方式：
//
//	connector := driver.GetSQLConnector("mysql")  // → SQLConnector（编译期安全）
//	db, err := sql.Open(connector.DSN(ds))
//	dbs, err := connector.ListDatabases(ctx, db)
//	cols, rows, err := driver.ScanRows(sqlRows, 10000)  // 通用辅助
package driver

// ConnConfig 连接配置（轻量，不依赖 datasource model，避免循环引用）
type ConnConfig struct {
	Type     string
	Host     string
	Port     int
	Username string
	Password string
	Database string
}

// ColumnInfo 列的元数据（用于结果集和表结构浏览）
type ColumnInfo struct {
	Name         string `json:"name"`
	DatabaseType string `json:"database_type,omitempty"` // "VARCHAR", "INT", "TIMESTAMP", …
	Length       *int64 `json:"length,omitempty"`        // VARCHAR(255) → 255
	Precision    *int   `json:"precision,omitempty"`     // DECIMAL(10,2) → 10
	Scale        *int   `json:"scale,omitempty"`         // DECIMAL(10,2) → 2
	Nullable     bool   `json:"nullable"`                // NOT NULL → false
	Comment      string `json:"comment,omitempty"`       // 列注释
}

// TableInfo 表元数据
type TableInfo struct {
	Database string `json:"database"`
	Table    string `json:"table"`
	Type     string `json:"type"` // "TABLE", "VIEW", …
}
