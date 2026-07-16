package parser

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
)

// esPatterns 分类规则：method + 路径中包含的关键子串。
// 按顺序匹配，优先匹配长度更长的规则。
var esPatterns = []struct {
	method string
	substr string
	opType pipeline.OpType
}{
	// ── Read ──
	{"GET", "/_search", pipeline.OpRead},
	{"POST", "/_search", pipeline.OpRead},
	{"GET", "/_count", pipeline.OpRead},
	{"POST", "/_count", pipeline.OpRead},
	{"GET", "/_cat/", pipeline.OpRead},
	{"GET", "/_cluster", pipeline.OpRead},
	{"GET", "/_mapping", pipeline.OpRead},
	{"GET", "/_settings", pipeline.OpRead},
	{"GET", "/_validate", pipeline.OpRead},
	{"GET", "/_explain", pipeline.OpRead},
	{"POST", "/_explain", pipeline.OpRead},

	// ── Write（修改数据/映射）──
	{"POST", "/_doc", pipeline.OpWrite},
	{"POST", "/_update/", pipeline.OpWrite},
	{"POST", "/_bulk", pipeline.OpWrite},
	{"POST", "/_update_by_query", pipeline.OpWrite},
	{"POST", "/_delete_by_query", pipeline.OpWrite},
	{"POST", "/_reindex", pipeline.OpWrite},
	{"PUT", "/_doc", pipeline.OpWrite},
	{"PUT", "/_create", pipeline.OpWrite},
	{"PUT", "/_mapping", pipeline.OpWrite},
	{"POST", "/_rollover", pipeline.OpWrite},
	{"DELETE", "/_doc/", pipeline.OpWrite},

	// ── Dangerous（结构变更/集群操作）──
	{"DELETE", "/", pipeline.OpDangerous},
	{"POST", "/_close", pipeline.OpDangerous},
	{"POST", "/_open", pipeline.OpDangerous},
	{"POST", "/_freeze", pipeline.OpDangerous},
	{"POST", "/_unfreeze", pipeline.OpDangerous},
	{"POST", "/_forcemerge", pipeline.OpDangerous},
	{"POST", "/_shrink", pipeline.OpDangerous},
	{"POST", "/_split", pipeline.OpDangerous},
	{"DELETE", "/_index_template", pipeline.OpDangerous},
	{"POST", "/_cache/clear", pipeline.OpWrite},
}

// ESParser ES 操作分类解析器。
// 输入格式：每行一个操作，METHOD /path
type ESParser struct{}

func NewESParser() *ESParser { return &ESParser{} }

func (p *ESParser) Types() []pipeline.DataSourceType {
	return []pipeline.DataSourceType{pipeline.DsES}
}

func (p *ESParser) Parse(_ context.Context, dsType string, raw string) ([]pipeline.Instruction, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	lines := strings.Split(raw, "\n")
	var result []pipeline.Instruction

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "//") || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.Fields(line)
		if len(parts) < 2 {
			continue
		}

		method := strings.ToUpper(parts[0])
		path := parts[1]

		opType := classifyESOp(method, path)
		args := []string{path}
		if len(parts) > 2 {
			args = append(args, parts[2:]...)
		}
		if len(args) > 10 {
			args = args[:10]
		}

		cmdStr := method + " " + path
		result = append(result, pipeline.Instruction{
			Type:    pipeline.DataSourceType(dsType),
			Command: cmdStr,
			Args:    args,
			Raw:     line,
			OpType:  opType,
		})
	}

	if len(result) == 0 {
		result = append(result, pipeline.Instruction{
			Type:    pipeline.DataSourceType(dsType),
			Command: "UNKNOWN",
			Raw:     raw,
			OpType:  pipeline.OpUnknown,
		})
	}

	return result, nil
}

func classifyESOp(method, path string) pipeline.OpType {
	// 优先匹配：长的子串优先
	type match struct {
		substr string
		opType pipeline.OpType
	}
	var candidates []match

	for _, p := range esPatterns {
		if p.method == method && strings.Contains(path, p.substr) {
			candidates = append(candidates, match{p.substr, p.opType})
		}
	}

	if len(candidates) == 0 {
		// 默认：GET/HEAD/OPTIONS 一律读，其他一律写
		switch method {
		case "GET", "HEAD", "OPTIONS":
			return pipeline.OpRead
		default:
			return pipeline.OpWrite
		}
	}

	// 返回匹配到的最长子串
	longest := candidates[0]
	for _, c := range candidates[1:] {
		if len(c.substr) > len(longest.substr) {
			longest = c
		}
	}
	return longest.opType
}
