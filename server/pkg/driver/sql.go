package driver

import (
	"context"
	"database/sql"
	"fmt"
)

// SQLConnector 针对 SQL 族数据源的连接器接口。
// 所有 SQL 类型（MySQL / PostgreSQL / TiDB / …）都实现此接口。
//
// 调用方在获取到 typed *sql.DB 后再使用这个接口，
// 不存在 any 类型泄漏的问题。
type SQLConnector interface {
	// DSN 返回 (sql.Open 驱动名, DSN 字符串)
	DSN(cfg ConnConfig) (string, string)

	// SetDatabase 切换当前数据库上下文。
	// MySQL 系: USE `dbname`
	// PostgreSQL: SET search_path TO "dbname"
	SetDatabase(ctx context.Context, db *sql.DB, database string) error

	// ListDatabases 返回服务上的所有数据库名。
	ListDatabases(ctx context.Context, db *sql.DB) ([]string, error)

	// ListTables 返回指定数据库下的所有表。
	ListTables(ctx context.Context, db *sql.DB, database string) ([]TableInfo, error)

	// ListColumns 返回指定表的列信息。
	ListColumns(ctx context.Context, db *sql.DB, database, table string) ([]ColumnInfo, error)

	// DefaultPort 返回该类型的默认端口号。
	DefaultPort() int
}

// ScanRows 通用的 SQL 行扫描函数。
// 从 *sql.Rows 中提取列类型信息并读取所有行数据。
// maxRows <= 0 表示不限制。
//
// 返回值:
//   - columns: 带类型的列信息
//   - rows: 每行数据（[]byte 已自动转为 string）
//   - error: 扫描过程中的错误
func ScanRows(rows *sql.Rows, maxRows int) ([]ColumnInfo, [][]any, error) {
	colTypes, err := rows.ColumnTypes()
	if err != nil {
		rows.Close()
		return nil, nil, fmt.Errorf("get column types: %w", err)
	}

	cols := make([]ColumnInfo, len(colTypes))
	for i, ct := range colTypes {
		cols[i] = ColumnInfo{
			Name:         ct.Name(),
			DatabaseType: ct.DatabaseTypeName(),
		}
		if length, ok := ct.Length(); ok {
			cols[i].Length = &length
		}
		if precision, scale, ok := ct.DecimalSize(); ok {
			p := int(precision)
			s := int(scale)
			cols[i].Precision = &p
			cols[i].Scale = &s
		}
		if nullable, ok := ct.Nullable(); ok {
			cols[i].Nullable = nullable
		}
	}

	var resultRows [][]any
	for rows.Next() {
		if maxRows > 0 && len(resultRows) >= maxRows {
			break
		}
		values := make([]any, len(colTypes))
		scanArgs := make([]any, len(colTypes))
		for i := range values {
			scanArgs[i] = &values[i]
		}
		if err := rows.Scan(scanArgs...); err != nil {
			rows.Close()
			return nil, nil, fmt.Errorf("scan row: %w", err)
		}
		rowVals := make([]any, len(values))
		for i, v := range values {
			switch val := v.(type) {
			case []byte:
				rowVals[i] = string(val)
			default:
				rowVals[i] = val
			}
		}
		resultRows = append(resultRows, rowVals)
	}
	rows.Close()

	return cols, resultRows, nil
}
