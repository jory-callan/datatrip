package seeds

import (
	"embed"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

//go:embed sql/required/*.sql sql/test/*.sql
var sqlFiles embed.FS

func Seed(db *gorm.DB) error {
	return execDir(db, "sql/required")
}

func execDir(db *gorm.DB, dir string) error {
	if db == nil {
		return nil
	}

	files, err := fs.Glob(sqlFiles, filepath.ToSlash(filepath.Join(dir, "*.sql")))
	if err != nil {
		return err
	}
	sort.Strings(files)

	for _, file := range files {
		content, err := sqlFiles.ReadFile(file)
		if err != nil {
			return err
		}

		statements := splitSQL(string(content))
		for i, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				continue
			}
			if err := db.Exec(stmt).Error; err != nil {
				return fmt.Errorf("exec seed sql %s (statement %d): %w", file, i+1, err)
			}
		}
	}

	return nil
}

// splitSQL 将 SQL 内容按分号拆分为多条语句，忽略注释行。
func splitSQL(sql string) []string {
	var stmts []string
	var buf strings.Builder
	for _, line := range strings.Split(sql, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}
		buf.WriteString(line)
		buf.WriteByte('\n')
		if strings.HasSuffix(strings.TrimSpace(trimmed), ";") {
			stmts = append(stmts, buf.String())
			buf.Reset()
		}
	}
	// Flush trailing content that ends without semicolon
	remaining := strings.TrimSpace(buf.String())
	if remaining != "" {
		stmts = append(stmts, remaining)
	}
	return stmts
}
