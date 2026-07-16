package parser

import (
	"context"
	"regexp"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
)

var sqlSplitter = regexp.MustCompile(`;\s*`)

var sqlKeywordPatterns = []struct {
	keyword string
	opType  pipeline.OpType
	command string
}{
	{`^\s*SELECT\b`, pipeline.OpRead, "SELECT"},
	{`^\s*SHOW\b`, pipeline.OpRead, "SHOW"},
	{`^\s*DESC\b`, pipeline.OpRead, "DESC"},
	{`^\s*DESCRIBE\b`, pipeline.OpRead, "DESCRIBE"},
	{`^\s*EXPLAIN\b`, pipeline.OpRead, "EXPLAIN"},
	{`^\s*INSERT\b`, pipeline.OpWrite, "INSERT"},
	{`^\s*UPDATE\b`, pipeline.OpWrite, "UPDATE"},
	{`^\s*DELETE\b`, pipeline.OpWrite, "DELETE"},
	{`^\s*REPLACE\b`, pipeline.OpWrite, "REPLACE"},
	{`^\s*CREATE\b`, pipeline.OpDangerous, "CREATE"},
	{`^\s*ALTER\b`, pipeline.OpDangerous, "ALTER"},
	{`^\s*DROP\b`, pipeline.OpDangerous, "DROP"},
	{`^\s*TRUNCATE\b`, pipeline.OpDangerous, "TRUNCATE"},
}

// SQLParser 实现了 pipeline.Parser 接口，适用于所有 SQL 类型数据源
type SQLParser struct{}

func NewSQLParser() *SQLParser {
	return &SQLParser{}
}

func (p *SQLParser) Types() []pipeline.DataSourceType {
	return []pipeline.DataSourceType{
		pipeline.DsMySQL,
		pipeline.DsPostgreSQL,
		pipeline.DsTiDB,
		pipeline.DsOceanBase,
	}
}

func (p *SQLParser) Parse(_ context.Context, dsType string, raw string) ([]pipeline.Instruction, error) {
	parts := sqlSplitter.Split(raw, -1)
	var result []pipeline.Instruction
	for _, part := range parts {
		part = strings.TrimSpace(part)
		part = strings.TrimSuffix(part, ";")
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		upper := strings.ToUpper(part)
		opType, command := classifyByKeyword(upper)
		inst := pipeline.Instruction{
			Type:    pipeline.DataSourceType(dsType),
			Command: command,
			Args:    extractArgs(part, command),
			Raw:     part,
			OpType:  opType,
		}
		result = append(result, inst)
	}
	return result, nil
}

func classifyByKeyword(upperSQL string) (pipeline.OpType, string) {
	for _, kp := range sqlKeywordPatterns {
		re := regexp.MustCompile(kp.keyword)
		if re.MatchString(upperSQL) {
			return kp.opType, kp.command
		}
	}
	return pipeline.OpUnknown, "unknown"
}

func extractArgs(sql, command string) []string {
	trimmed := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(sql), command))
	trimmed = strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(trimmed), command))
	if trimmed == "" {
		return nil
	}
	parts := strings.Fields(trimmed)
	if len(parts) > 5 {
		parts = parts[:5]
	}
	return parts
}
