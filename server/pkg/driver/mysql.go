package driver

import (
	"context"
	"database/sql"
	"fmt"
)

func init() {
	// MySQL 协议兼容族：MySQL、TiDB、OceanBase、MariaDB 共用同一个连接器
	RegisterSQLConnector("mysql", &mysqlConnector{})
	RegisterSQLConnector("tidb", &mysqlConnector{})
	RegisterSQLConnector("oceanbase", &mysqlConnector{})
	RegisterSQLConnector("mariadb", &mysqlConnector{})
}

type mysqlConnector struct{}

func (m *mysqlConnector) DSN(cfg ConnConfig) (string, string) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=true&loc=Local",
		cfg.Username, cfg.Password, cfg.Host, cfg.Port, cfg.Database)
	return "mysql", dsn
}

func (m *mysqlConnector) SetDatabase(ctx context.Context, db *sql.DB, database string) error {
	if database == "" {
		return nil
	}
	_, err := db.ExecContext(ctx, "USE `"+database+"`")
	return err
}

func (m *mysqlConnector) ListDatabases(ctx context.Context, db *sql.DB) ([]string, error) {
	rows, err := db.QueryContext(ctx, "SHOW DATABASES")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		result = append(result, name)
	}
	return result, rows.Err()
}

func (m *mysqlConnector) ListTables(ctx context.Context, db *sql.DB, database string) ([]TableInfo, error) {
	rows, err := db.QueryContext(ctx,
		"SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?", database)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []TableInfo
	for rows.Next() {
		var tbl TableInfo
		tbl.Database = database
		if err := rows.Scan(&tbl.Table, &tbl.Type); err != nil {
			return nil, err
		}
		result = append(result, tbl)
	}
	return result, rows.Err()
}

func (m *mysqlConnector) ListColumns(ctx context.Context, db *sql.DB, database, table string) ([]ColumnInfo, error) {
	if database == "" {
		return nil, fmt.Errorf("database is required")
	}
	rows, err := db.QueryContext(ctx, `
		SELECT
			COLUMN_NAME,
			DATA_TYPE,
			IS_NULLABLE,
			CHARACTER_MAXIMUM_LENGTH,
			NUMERIC_PRECISION,
			NUMERIC_SCALE,
			COLUMN_COMMENT
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION
	`, database, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []ColumnInfo
	for rows.Next() {
		var col ColumnInfo
		var nullable string
		var charLen, numPrecision, numScale *int64
		if err := rows.Scan(&col.Name, &col.DatabaseType, &nullable, &charLen, &numPrecision, &numScale, &col.Comment); err != nil {
			return nil, err
		}
		if charLen != nil {
			col.Length = charLen
		}
		if numPrecision != nil {
			p := int(*numPrecision)
			col.Precision = &p
		}
		if numScale != nil {
			s := int(*numScale)
			col.Scale = &s
		}
		col.Nullable = nullable == "YES"
		result = append(result, col)
	}
	return result, rows.Err()
}

func (m *mysqlConnector) DefaultPort() int {
	return 3306
}
