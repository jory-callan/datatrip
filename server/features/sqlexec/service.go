package sqlexec

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/dsrule"
	"czwlinux.cloud/go-friday-starter/features/escalation"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/dbpool"
	"czwlinux.cloud/go-friday-starter/pkg/sqlclassifier"
	"go.uber.org/zap"
)

const (
	defaultQueryTimeout = 30 * time.Second // SQL 执行默认超时
	maxResultRows       = 10000            // 查询结果最大行数
)

var (
	sqlSplitter = regexp.MustCompile(`;\s*`)
)

// splitSQL splits a multi-statement SQL string into individual statements.
func splitSQL(sql string) []string {
	parts := sqlSplitter.Split(sql, -1)
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			// Remove trailing semicolon
			p = strings.TrimSuffix(p, ";")
			p = strings.TrimSpace(p)
			if p != "" {
				result = append(result, p)
			}
		}
	}
	return result
}

// ExecuteSQL handles SQL execution. Returns the execution result or a ticket request for writes.
func ExecuteSQL(ctx context.Context, userID uint, req ExecuteRequest) (any, error) {
	// 1. Validate inputs
	if req.ProjectID == 0 || req.Sql == "" {
		return nil, fmt.Errorf("invalid param")
	}

	sqlToExecute := req.Sql
	if req.SelectedText != "" {
		sqlToExecute = req.SelectedText
	}

	// 2. Check project exists and user has access
	proj, err := project.GetByID(ctx, req.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("project not found")
	}

	role := project.GetUserProjectRole(ctx, req.ProjectID, userID)
	if role == "" {
		return nil, fmt.Errorf("forbidden: no project access")
	}

	// 3. Validate database access against project's database patterns (supports * wildcard)
	projDatabases := project.SplitDatabases(proj.Databases)
	dbName := req.Database
	if dbName != "" {
		if !project.IsDatabaseAllowed(projDatabases, dbName) {
			return nil, fmt.Errorf("database '%s' is not in the project's allowed databases", dbName)
		}
	} else if len(projDatabases) == 1 && !project.HasWildcard(projDatabases) {
		// Single exact database — auto-use it
		dbName = projDatabases[0]
	}

	// 4. Get datasource
	ds, err := datasource.GetByID(ctx, proj.DatasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found")
	}

	// 5. Split SQL into statements
	statements := splitSQL(sqlToExecute)
	if len(statements) == 0 {
		return nil, fmt.Errorf("no valid SQL statements")
	}

	stmtJSON, _ := json.Marshal(statements)

	// 5. Classify each statement
	hasWrite := false
	hasDangerous := false
	hasUnknown := false
	var classifications []string
	for _, stmt := range statements {
		cls := sqlclassifier.Classify(stmt)
		classifications = append(classifications, cls.Operation)
		if cls.IsDangerous {
			hasDangerous = true
		}
		if cls.IsUnknown {
			hasUnknown = true
		} else if !cls.IsRead {
			hasWrite = true
		}
	}

	// 5b. Apply global enabled rules matched by datasource db_type for fine-grained classification
	rules, err := dsrule.GetEnabledRulesByDBType(ctx, ds.Type)
	if err != nil {
		global.Log.Warn("failed to load global sql rules", zap.Error(err))
	} else if len(rules) > 0 {
		for _, stmt := range statements {
			for _, rule := range rules {
				if dsrule.MatchRule(&rule, stmt) {
					switch rule.Category {
					case dsrule.CategoryDangerous:
						hasDangerous = true
					case dsrule.CategoryWrite:
						hasWrite = true
					}
					break
				}
			}
		}
	}

	// 6. Reject dangerous statements (CREATE / DROP / ALTER / TRUNCATE)
	if hasDangerous {
		// Record audit log
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:        userID,
			ProjectID:      req.ProjectID,
			DatasourceID:   proj.DatasourceID,
			Action:         "execute",
			Sql:            sqlToExecute,
			Classification: "dangerous",
			Status:         audit.StatusRejected,
			ErrorMessage:   "dangerous SQL rejected",
		})

		return nil, fmt.Errorf("dangerous SQL rejected: CREATE/DROP/ALTER/TRUNCATE are not allowed")
	}

	// 6b. Reject unknown/unrecognizable SQL — don't treat as write
	if hasUnknown {
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:        userID,
			ProjectID:      req.ProjectID,
			DatasourceID:   proj.DatasourceID,
			Action:         "execute",
			Sql:            sqlToExecute,
			Classification: "unknown",
			Status:         audit.StatusRejected,
			ErrorMessage:   "unrecognizable SQL statement",
		})

		return nil, fmt.Errorf("unrecognizable SQL statement: '%s' is not a valid SQL command", statements[0])
	}

	// 7. Handle write operations -> reject, tell user to use ticket or escalation
	if hasWrite {
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:        userID,
			ProjectID:      req.ProjectID,
			DatasourceID:   proj.DatasourceID,
			Action:         "execute",
			Sql:            sqlToExecute,
			Classification: "write",
			Status:         audit.StatusRejected,
			ErrorMessage:   "write operation rejected: use ticket submission or escalated execution",
		})
		return nil, fmt.Errorf("写操作已拒绝：请使用「提交工单」或「提权执行」按钮")
	}

	// 8. All SELECT -> execute and return results
	pool, err := dbpool.Get(ctx, proj.DatasourceID)
	if err != nil {
		return nil, fmt.Errorf("get db connection failed: %w", err)
	}

	// Create timeout context for SQL execution
	execCtx, cancel := context.WithTimeout(ctx, defaultQueryTimeout)
	defer cancel()

	// If we have a specific database to USE, execute USE statement first (for MySQL)
	if dbName != "" && ds.Type == "mysql" {
		if _, err := pool.ExecContext(execCtx, "USE `"+dbName+"`"); err != nil {
			return nil, fmt.Errorf("use database '%s' failed: %w", dbName, err)
		}
	}

	start := time.Now()
	var allResults []QueryResult
	totalRows := 0

	for _, stmt := range statements {
		// For PostgreSQL, use SET search_path for schema if database was specified
		queryStmt := stmt
		if dbName != "" && ds.Type == "postgresql" {
			queryStmt = "SET search_path TO \"" + dbName + "\"; " + stmt
		}

		rows, err := pool.QueryContext(execCtx, queryStmt)
		if err != nil {
			duration := int(time.Since(start).Milliseconds())

			// Save failed execution
			exec := &SqlExecution{
				ProjectID:      req.ProjectID,
				Sql:            sqlToExecute,
				Statements:     string(stmtJSON),
				Classification: strings.Join(classifications, ","),
				Status:         StatusFailed,
				DurationMs:     duration,
			}
			_ = CreateExecution(ctx, exec)

			// Audit log for failure
			audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
				ActorID:        userID,
				ProjectID:      req.ProjectID,
				DatasourceID:   proj.DatasourceID,
				Action:         "execute",
				Sql:            sqlToExecute,
				Classification: "read",
				Status:         audit.StatusFailed,
				ErrorMessage:   err.Error(),
				DurationMs:     duration,
			})

			return nil, fmt.Errorf("query failed: %w", err)
		}

		columns, err := rows.Columns()
		if err != nil {
			rows.Close()
			return nil, fmt.Errorf("get columns failed: %w", err)
		}

		var resultRows [][]any
		for rows.Next() {
			// Enforce max row limit across all result sets
			if totalRows+len(resultRows) >= maxResultRows {
				break
			}
			values := make([]any, len(columns))
			scanArgs := make([]any, len(columns))
			for i := range values {
				scanArgs[i] = &values[i]
			}
			if err := rows.Scan(scanArgs...); err != nil {
				rows.Close()
				return nil, fmt.Errorf("scan row failed: %w", err)
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

		allResults = append(allResults, QueryResult{
			Columns: columns,
			Rows:    resultRows,
			Total:   len(resultRows),
		})
		totalRows += len(resultRows)
	}

	duration := int(time.Since(start).Milliseconds())

	// Save successful execution
	exec := &SqlExecution{
		ProjectID:      req.ProjectID,
		Sql:            sqlToExecute,
		Statements:     string(stmtJSON),
		Classification: strings.Join(classifications, ","),
		Status:         StatusSuccess,
		RowCount:       totalRows,
		DurationMs:     duration,
	}
	if err := CreateExecution(ctx, exec); err != nil {
		global.Log.Warn("save execution failed", zap.Error(err))
	}

	// Audit log for success
	audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
		ActorID:        userID,
		ProjectID:      req.ProjectID,
		DatasourceID:   proj.DatasourceID,
		Action:         "execute",
		Sql:            sqlToExecute,
		Classification: "read",
		Status:         audit.StatusSuccess,
		DurationMs:     duration,
	})

	return map[string]interface{}{
		"mode":      "direct",
		"execution": ToDTO(exec),
		"results":   allResults,
	}, nil
}

func CreateExecution(ctx context.Context, exec *SqlExecution) error {
	return global.DB.WithContext(ctx).Create(exec).Error
}

// ExecuteEscalatedSQL executes write SQL with escalation check.
// Requires an active (approved + not expired) escalation for the project.
func ExecuteEscalatedSQL(ctx context.Context, userID uint, req ExecuteRequest) (any, error) {
	// 1. Validate inputs
	if req.ProjectID == 0 || req.Sql == "" {
		return nil, fmt.Errorf("invalid param")
	}

	sqlToExecute := req.Sql
	if req.SelectedText != "" {
		sqlToExecute = req.SelectedText
	}

	// 2. Check project exists
	proj, err := project.GetByID(ctx, req.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("project not found")
	}

	// 3. Check user has project access
	role := project.GetUserProjectRole(ctx, req.ProjectID, userID)
	if role == "" {
		return nil, fmt.Errorf("forbidden: no project access")
	}

	// 4. Validate database
	projDatabases := project.SplitDatabases(proj.Databases)
	dbName := req.Database
	if dbName != "" {
		if !project.IsDatabaseAllowed(projDatabases, dbName) {
			return nil, fmt.Errorf("database '%s' is not in the project's allowed databases", dbName)
		}
	} else if len(projDatabases) == 1 && !project.HasWildcard(projDatabases) {
		dbName = projDatabases[0]
	}

	// 5. Get datasource
	ds, err := datasource.GetByID(ctx, proj.DatasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found")
	}

	// 6. Split and classify
	statements := splitSQL(sqlToExecute)
	if len(statements) == 0 {
		return nil, fmt.Errorf("no valid SQL statements")
	}

	stmtJSON, _ := json.Marshal(statements)

	hasDangerous := false
	hasUnknown := false
	var classifications []string
	for _, stmt := range statements {
		cls := sqlclassifier.Classify(stmt)
		classifications = append(classifications, cls.Operation)
		if cls.IsDangerous {
			hasDangerous = true
		}
		if cls.IsUnknown {
			hasUnknown = true
		}
	}

	// 6b. Apply global enabled rules matched by datasource db_type
	rules, err := dsrule.GetEnabledRulesByDBType(ctx, ds.Type)
	if err != nil {
		global.Log.Warn("failed to load global sql rules", zap.Error(err))
	} else if len(rules) > 0 {
		for _, stmt := range statements {
			for _, rule := range rules {
				if dsrule.MatchRule(&rule, stmt) {
					switch rule.Category {
					case dsrule.CategoryDangerous:
						hasDangerous = true
					}
					break
				}
			}
		}
	}

	// 7. Reject dangerous
	// (hasWrite intentionally not checked for escalated execute — write is the point)
	if hasDangerous {
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:        userID,
			ProjectID:      req.ProjectID,
			DatasourceID:   proj.DatasourceID,
			Action:         "escalated_execute",
			Sql:            sqlToExecute,
			Classification: "dangerous",
			Status:         audit.StatusRejected,
			ErrorMessage:   "dangerous SQL rejected via escalation",
		})
		return nil, fmt.Errorf("dangerous SQL rejected: CREATE/DROP/ALTER/TRUNCATE are not allowed")
	}

	// 8. Reject unknown
	if hasUnknown {
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:        userID,
			ProjectID:      req.ProjectID,
			DatasourceID:   proj.DatasourceID,
			Action:         "escalated_execute",
			Sql:            sqlToExecute,
			Classification: "unknown",
			Status:         audit.StatusRejected,
			ErrorMessage:   "unrecognizable SQL statement",
		})
		return nil, fmt.Errorf("unrecognizable SQL statement")
	}

	// 9. Check active escalation
	activeResp, err := escalation.CheckActiveEscalation(ctx, userID, req.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("check escalation failed: %w", err)
	}
	if !activeResp.Active {
		audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
			ActorID:        userID,
			ProjectID:      req.ProjectID,
			DatasourceID:   proj.DatasourceID,
			Action:         "escalated_execute",
			Sql:            sqlToExecute,
			Classification: strings.Join(classifications, ","),
			Status:         audit.StatusRejected,
			ErrorMessage:   "no active escalation for this project",
		})
		return nil, fmt.Errorf("提权执行失败：当前项目无有效提权，请先申请提权")
	}

	// 10. Execute write SQL
	pool, err := dbpool.Get(ctx, proj.DatasourceID)
	if err != nil {
		return nil, fmt.Errorf("get db connection failed: %w", err)
	}

	// Create timeout context for SQL execution
	execCtx, cancel := context.WithTimeout(ctx, defaultQueryTimeout)
	defer cancel()

	if dbName != "" && ds.Type == "mysql" {
		if _, err := pool.ExecContext(execCtx, "USE `"+dbName+"`"); err != nil {
			return nil, fmt.Errorf("use database '%s' failed: %w", dbName, err)
		}
	}

	start := time.Now()
	var affectedRows int64
	var execErrStr string
	for i, stmt := range statements {
		queryStmt := stmt
		if dbName != "" && ds.Type == "postgresql" {
			queryStmt = "SET search_path TO \"" + dbName + "\"; " + stmt
		}
		result, execErr := pool.ExecContext(execCtx, queryStmt)
		if execErr != nil {
			if i == 0 {
				execErrStr = execErr.Error()
			} else {
				execErrStr += "; " + execErr.Error()
			}
		} else if result != nil {
			rows, _ := result.RowsAffected()
			affectedRows += rows
		}
	}

	duration := int(time.Since(start).Milliseconds())

	status := StatusSuccess
	if execErrStr != "" {
		status = StatusFailed
	}

	// Save execution record
	exec := &SqlExecution{
		ProjectID:      req.ProjectID,
		Sql:            sqlToExecute,
		Statements:     string(stmtJSON),
		Classification: strings.Join(classifications, ","),
		Status:         status,
		AffectedRows:   int(affectedRows),
		DurationMs:     duration,
	}
	_ = CreateExecution(ctx, exec)

	// Audit log
	auditStatus := audit.StatusSuccess
	errMsg := ""
	if execErrStr != "" {
		auditStatus = audit.StatusFailed
		errMsg = execErrStr
	}
	audit.CreateAuditLog(ctx, audit.CreateAuditLogRequest{
		ActorID:        userID,
		ProjectID:      req.ProjectID,
		DatasourceID:   proj.DatasourceID,
		Action:         "escalated_execute",
		Sql:            sqlToExecute,
		Classification: strings.Join(classifications, ","),
		Status:         auditStatus,
		ErrorMessage:   errMsg,
		DurationMs:     duration,
	})

	if execErrStr != "" {
		return nil, fmt.Errorf("execution failed: %s", execErrStr)
	}

	return map[string]interface{}{
		"mode":      "direct",
		"execution": ToDTO(exec),
		"results":   []QueryResult{},
	}, nil
}
