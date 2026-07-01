package sqlexec

import (
	"context"
	"database/sql"
	"fmt"

	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/pkg/httpx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
)

// MetaHandler handles metadata browsing (databases, tables).
type MetaHandler struct{}

func NewMetaHandler() *MetaHandler {
	return &MetaHandler{}
}

// getTemporaryConn creates a temporary connection for metadata queries (not using the pool).
func getTemporaryConn(ctx context.Context, ds *datasource.Datasource) (*sql.DB, error) {
	var dsn, driver string
	switch ds.Type {
	case datasource.TypeMySQL:
		// Connect without a specific database
		dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=utf8mb4&parseTime=True&loc=Local",
			ds.Username, ds.Password, ds.Host, ds.Port)
		driver = "mysql"
	case datasource.TypePostgreSQL:
		// Connect to the default "postgres" database
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%d/postgres?sslmode=disable",
			ds.Username, ds.Password, ds.Host, ds.Port)
		driver = "pgx"
	default:
		return nil, fmt.Errorf("unsupported datasource type: %s", ds.Type)
	}

	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, fmt.Errorf("open temp connection: %w", err)
	}
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("ping temp connection: %w", err)
	}
	return db, nil
}

// ListDatabases returns the list of databases accessible to this project.
// GET /projects/:id/meta/databases
func (h *MetaHandler) ListDatabases(c echo.Context) error {
	projectID, err := parseParamUint(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid project id")
	}

	userID := httpx.CurrentUserID(c)
	if userID == 0 {
		return response.Unauthorized(c, "unauthorized")
	}

	// Check project access
	role := project.GetUserProjectRole(c.Request().Context(), projectID, userID)
	if role == "" {
		return response.Forbidden(c, "no project access")
	}

	proj, err := project.GetByID(c.Request().Context(), projectID)
	if err != nil {
		return response.NotFound(c, "project not found")
	}
	ds, err := datasource.GetByID(c.Request().Context(), proj.DatasourceID)
	if err != nil {
		return response.NotFound(c, "datasource not found")
	}

	allowedPatterns := project.SplitDatabases(proj.Databases)

	// If patterns are exact names (no wildcards), return them directly — no DB connection needed
	if !project.HasWildcard(allowedPatterns) {
		return response.Ok(c, map[string]any{
			"databases": allowedPatterns,
		})
	}

	// Wildcard detected — connect to datasource and list actual databases
	conn, err := getTemporaryConn(c.Request().Context(), ds)
	if err != nil {
		return response.InternalError(c, "connect to datasource failed")
	}
	defer conn.Close()

	actualDBs, err := fetchDatabases(c.Request().Context(), conn, ds.Type)
	if err != nil {
		return response.InternalError(c, "list databases failed")
	}

	// Filter by patterns
	var matched []string
	for _, db := range actualDBs {
		if project.IsDatabaseAllowed(allowedPatterns, db) {
			matched = append(matched, db)
		}
	}

	return response.Ok(c, map[string]any{
		"databases": matched,
	})
}

// ListTables returns the list of tables in a database.
// GET /projects/:id/meta/tables?database=xxx
func (h *MetaHandler) ListTables(c echo.Context) error {
	projectID, err := parseParamUint(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid project id")
	}

	dbName := c.QueryParam("database")
	if dbName == "" {
		return response.BadRequest(c, "database is required")
	}

	userID := httpx.CurrentUserID(c)
	if userID == 0 {
		return response.Unauthorized(c, "unauthorized")
	}

	// Check project access
	role := project.GetUserProjectRole(c.Request().Context(), projectID, userID)
	if role == "" {
		return response.Forbidden(c, "no project access")
	}

	proj, err := project.GetByID(c.Request().Context(), projectID)
	if err != nil {
		return response.NotFound(c, "project not found")
	}

	// Validate database is allowed by project patterns
	allowedPatterns := project.SplitDatabases(proj.Databases)
	if !project.IsDatabaseAllowed(allowedPatterns, dbName) {
		return response.Forbidden(c, "database not in project scope")
	}

	ds, err := datasource.GetByID(c.Request().Context(), proj.DatasourceID)
	if err != nil {
		return response.NotFound(c, "datasource not found")
	}

	conn, err := getTemporaryConn(c.Request().Context(), ds)
	if err != nil {
		return response.InternalError(c, "connect to datasource failed")
	}
	defer conn.Close()

	tables, err := fetchTables(c.Request().Context(), conn, ds.Type, dbName)
	if err != nil {
		return response.InternalError(c, "list tables failed")
	}

	return response.Ok(c, map[string]any{
		"tables": tables,
	})
}

func fetchDatabases(ctx context.Context, conn *sql.DB, dbType string) ([]string, error) {
	var rows *sql.Rows
	var err error

	switch dbType {
	case datasource.TypeMySQL:
		rows, err = conn.QueryContext(ctx, "SHOW DATABASES")
	case datasource.TypePostgreSQL:
		rows, err = conn.QueryContext(ctx, "SELECT datname FROM pg_database WHERE datistemplate = false")
	default:
		return nil, fmt.Errorf("unsupported type: %s", dbType)
	}

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

type TableInfo struct {
	Database string `json:"database"`
	Table    string `json:"table"`
	Type     string `json:"type"`
}

func fetchTables(ctx context.Context, conn *sql.DB, dbType, dbName string) ([]TableInfo, error) {
	var rows *sql.Rows
	var err error

	switch dbType {
	case datasource.TypeMySQL:
		rows, err = conn.QueryContext(ctx, "SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?", dbName)
	case datasource.TypePostgreSQL:
		rows, err = conn.QueryContext(ctx,
			"SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')")
	default:
		return nil, fmt.Errorf("unsupported type: %s", dbType)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []TableInfo
	for rows.Next() {
		var tableName, tableType string
		switch dbType {
		case datasource.TypeMySQL:
			if err := rows.Scan(&tableName, &tableType); err != nil {
				return nil, err
			}
		case datasource.TypePostgreSQL:
			if err := rows.Scan(&tableName); err != nil {
				return nil, err
			}
			tableType = "TABLE"
		}
		result = append(result, TableInfo{
			Database: dbName,
			Table:    tableName,
			Type:     tableType,
		})
	}
	return result, rows.Err()
}

func parseParamUint(s string) (uint, error) {
	var n uint
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, fmt.Errorf("not a number")
		}
		n = n*10 + uint(c-'0')
	}
	return n, nil
}
