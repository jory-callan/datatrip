package exec

import (
	"context"
	"database/sql"
	"fmt"

	"czwlinux.cloud/go-friday-starter/features/auth"
	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/pkg/driver"
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
// Connects to the server without selecting a specific database.
func getTemporaryConn(ctx context.Context, ds *datasource.Datasource) (*sql.DB, error) {
	c, err := driver.GetSQLConnector(ds.Type)
	if err != nil {
		return nil, fmt.Errorf("unsupported datasource type: %s", ds.Type)
	}

	// Use empty database name for the initial listing connection
	driverName, dsnStr := c.DSN(driver.ConnConfig{
		Type:     ds.Type,
		Host:     ds.Host,
		Port:     ds.Port,
		Username: ds.Username,
		Password: ds.Password,
	})

	db, err := sql.Open(driverName, dsnStr)
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
	projectID := c.Param("id")
	if projectID == "" {
		return response.BadRequest(c, "invalid project id")
	}

	userID := httpx.CurrentUserID(c)
	if userID == "" {
		return response.Unauthorized(c, "unauthorized")
	}

	// Check project access
	codes, _ := auth.GetUserPermissionCodes(c.Request().Context(), userID)
	if !project.HasProjectAccess(c.Request().Context(), userID, projectID, codes) {
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

	allowedPatterns := project.SplitDatabases(proj.Scope)

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
	projectID := c.Param("id")
	if projectID == "" {
		return response.BadRequest(c, "invalid project id")
	}

	dbName := c.QueryParam("database")
	if dbName == "" {
		return response.BadRequest(c, "database is required")
	}

	userID := httpx.CurrentUserID(c)
	if userID == "" {
		return response.Unauthorized(c, "unauthorized")
	}

	// Check project access
	codes, _ := auth.GetUserPermissionCodes(c.Request().Context(), userID)
	if !project.HasProjectAccess(c.Request().Context(), userID, projectID, codes) {
		return response.Forbidden(c, "no project access")
	}

	proj, err := project.GetByID(c.Request().Context(), projectID)
	if err != nil {
		return response.NotFound(c, "project not found")
	}

	// Validate database is allowed by project patterns
	allowedPatterns := project.SplitDatabases(proj.Scope)
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

// ListColumns returns the list of columns for a table.
// GET /projects/:id/meta/columns?database=xxx&table=yyy
func (h *MetaHandler) ListColumns(c echo.Context) error {
	projectID := c.Param("id")
	if projectID == "" {
		return response.BadRequest(c, "invalid project id")
	}

	dbName := c.QueryParam("database")
	if dbName == "" {
		return response.BadRequest(c, "database is required")
	}
	tableName := c.QueryParam("table")
	if tableName == "" {
		return response.BadRequest(c, "table is required")
	}

	userID := httpx.CurrentUserID(c)
	if userID == "" {
		return response.Unauthorized(c, "unauthorized")
	}

	codes, _ := auth.GetUserPermissionCodes(c.Request().Context(), userID)
	if !project.HasProjectAccess(c.Request().Context(), userID, projectID, codes) {
		return response.Forbidden(c, "no project access")
	}

	proj, err := project.GetByID(c.Request().Context(), projectID)
	if err != nil {
		return response.NotFound(c, "project not found")
	}

	allowedPatterns := project.SplitDatabases(proj.Scope)
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

	columns, err := fetchColumns(c.Request().Context(), conn, ds.Type, dbName, tableName)
	if err != nil {
		return response.InternalError(c, "list columns failed")
	}

	return response.Ok(c, map[string]any{
		"columns": columns,
	})
}

func fetchDatabases(ctx context.Context, conn *sql.DB, dbType string) ([]string, error) {
	c, err := driver.GetSQLConnector(dbType)
	if err != nil {
		return nil, fmt.Errorf("unsupported type: %s", dbType)
	}
	return c.ListDatabases(ctx, conn)
}

// fetchTables uses the driver connector to list tables.
func fetchTables(ctx context.Context, conn *sql.DB, dbType, dbName string) ([]driver.TableInfo, error) {
	c, err := driver.GetSQLConnector(dbType)
	if err != nil {
		return nil, fmt.Errorf("unsupported type: %s", dbType)
	}
	return c.ListTables(ctx, conn, dbName)
}

// fetchColumns uses the driver connector to list columns with comments.
func fetchColumns(ctx context.Context, conn *sql.DB, dbType, dbName, tableName string) ([]driver.ColumnInfo, error) {
	c, err := driver.GetSQLConnector(dbType)
	if err != nil {
		return nil, fmt.Errorf("unsupported type: %s", dbType)
	}
	return c.ListColumns(ctx, conn, dbName, tableName)
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
