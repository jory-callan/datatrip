package parser

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
)

// mongoCommands 映射 MongoDB 命令的分类。
var mongoCommands = map[string]pipeline.OpType{
	// Read
	"FIND":           pipeline.OpRead,
	"FINDONE":        pipeline.OpRead,
	"FINDONEAND":     pipeline.OpRead,
	"FINDONEANDDEL":  pipeline.OpRead,
	"FINDONEANDREP":  pipeline.OpRead,
	"FINDONEANDUPD":  pipeline.OpRead,
	"AGGREGATE":      pipeline.OpRead,
	"COUNT":          pipeline.OpRead,
	"COUNTDOCUMENTS": pipeline.OpRead,
	"DISTINCT":       pipeline.OpRead,
	"LISTDATABASES":  pipeline.OpRead,
	"LISTCOLLECTNS":  pipeline.OpRead,

	// Write
	"INSERTONE":     pipeline.OpWrite,
	"INSERTMANY":    pipeline.OpWrite,
	"UPDATEONE":     pipeline.OpWrite,
	"UPDATEMANY":    pipeline.OpWrite,
	"REPLACEONE":    pipeline.OpWrite,
	"DELETEONE":     pipeline.OpWrite,
	"DELETEMANY":    pipeline.OpWrite,
	"BULKWRITE":     pipeline.OpWrite,
	"CREATECOLLECT": pipeline.OpWrite,
	"DROPCOL":       pipeline.OpWrite,
	"CREATEINDEX":   pipeline.OpWrite,
	"DROPINDEX":     pipeline.OpWrite,
	"RENAMECOLL":    pipeline.OpWrite,

	// Dangerous
	"DROPDATABASE": pipeline.OpDangerous,
	"DROP":         pipeline.OpDangerous,
	"DBDROP":       pipeline.OpDangerous,
	"EVAL":         pipeline.OpDangerous,
	"ADMCOMMAND":   pipeline.OpDangerous,
}

// MongoParser MongoDB 命令解析器。
type MongoParser struct{}

func NewMongoParser() *MongoParser {
	return &MongoParser{}
}

func (p *MongoParser) Types() []pipeline.DataSourceType {
	return []pipeline.DataSourceType{pipeline.DsMongoDB}
}

func (p *MongoParser) Parse(_ context.Context, dsType string, raw string) ([]pipeline.Instruction, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}

	lines := strings.Split(raw, "\n")
	var result []pipeline.Instruction

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		upper := strings.ToUpper(line)
		parts := strings.Fields(upper)
		if len(parts) == 0 {
			continue
		}

		cmd := parts[0]
		opType, found := mongoCommands[cmd]
		if !found {
			opType = pipeline.OpUnknown
		}

		args := make([]string, 0, len(parts)-1)
		for _, a := range strings.Fields(line)[1:] {
			args = append(args, a)
		}
		if len(args) > 20 {
			args = args[:20]
		}

		result = append(result, pipeline.Instruction{
			Type:    pipeline.DataSourceType(dsType),
			Command: cmd,
			Args:    args,
			Raw:     line,
			OpType:  opType,
		})
	}
	return result, nil
}
