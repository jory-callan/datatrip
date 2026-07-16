package driver

import (
	"context"
	"database/sql"
	"fmt"
)

func init() {
	RegisterSQLConnector("postgresql", &pgConnector{})
}

type pgConnector struct{}

func (p *pgConnector) DSN(cfg ConnConfig) (string, string) {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
		cfg.Username, cfg.Password, cfg.Host, cfg.Port, cfg.Database)
	return "pgx", dsn
}

func (p *pgConnector) SetDatabase(ctx context.Context, db *sql.DB, database string) error {
	if database == "" {
		return nil
	}
	_, err := db.ExecContext(ctx, `SET search_path TO "`+database+`"`)
	return err
}

func (p *pgConnector) ListDatabases(ctx context.Context, db *sql.DB) ([]string, error) {
	rows, err := db.QueryContext(ctx, "SELECT datname FROM pg_database WHERE datistemplate = false")
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

func (p *pgConnector) ListTables(ctx context.Context, db *sql.DB, database string) ([]TableInfo, error) {
	// PostgreSQL 使用 search_path 而不是 database 限定
	rows, err := db.QueryContext(ctx, `
		SELECT tablename, 'TABLE'
		FROM pg_catalog.pg_tables
		WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
	`)
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

func (p *pgConnector) ListColumns(ctx context.Context, db *sql.DB, database, table string) ([]ColumnInfo, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT
			c.column_name,
			c.data_type,
			c.is_nullable,
			c.character_maximum_length,
			c.numeric_precision,
			c.numeric_scale,
			COALESCE(c.column_comment, '')
		FROM information_schema.columns c
		WHERE c.table_catalog = $1 AND c.table_name = $2
		ORDER BY c.ordinal_position
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

func (p *pgConnector) DefaultPort() int {
	return 5432
}
