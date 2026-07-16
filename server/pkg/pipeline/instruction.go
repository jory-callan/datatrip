package pipeline

// DataSourceType 数据源具体类型
type DataSourceType string

const (
	DsMySQL      DataSourceType = "mysql"
	DsPostgreSQL DataSourceType = "postgresql"
	DsTiDB       DataSourceType = "tidb"
	DsOceanBase  DataSourceType = "oceanbase"
	DsRedis      DataSourceType = "redis"
	DsMongoDB    DataSourceType = "mongo"
	DsES         DataSourceType = "es"
	DsKafka      DataSourceType = "kafka"
)

// TypeGroup 数据源类型分组（内置，不持久化在 Instruction 中）
type TypeGroup string

const (
	GroupSQL    TypeGroup = "sql"
	GroupNoSQL  TypeGroup = "nosql"
	GroupSearch TypeGroup = "search"
	GroupMQ     TypeGroup = "mq"
)

// OpType 操作类型枚举
type OpType string

const (
	OpRead      OpType = "read"      // 直接执行
	OpWrite     OpType = "write"     // 走工单
	OpDangerous OpType = "dangerous" // 直接拒绝
	OpUnknown   OpType = "unknown"   // 无法识别，返回错误
)

// Instruction 统一指令结构体，与数据源类型无关
type Instruction struct {
	Type      DataSourceType `json:"type"`       // 数据源具体类型: mysql / redis / mongo
	TypeGroup string         `json:"type_group"` // 数据源类型分组: sql / nosql / search / mq
	Command   string         `json:"command"`    // SELECT / KEYS / get / find
	Args      []string       `json:"args"`       // 操作参数，由 Parser 提取
	Raw       string         `json:"raw"`        // 原始输入文本
	OpType    OpType         `json:"op_type"`    // read / write / dangerous / unknown
}

// TypeDef 数据源类型定义（用于前端 API）
type TypeDef struct {
	Type  string `json:"type"`
	Label string `json:"label"`
}

// TypeGroupDef 类型分组定义（用于前端 API）
type TypeGroupDef struct {
	Group string    `json:"group"`
	Label string    `json:"label"`
	Types []TypeDef `json:"types"`
}

// DatasourceTypes 内置类型映射表
var DatasourceTypes = map[string]struct {
	Group TypeGroup
	Label string
}{
	"mysql":      {Group: GroupSQL, Label: "MySQL"},
	"postgresql": {Group: GroupSQL, Label: "PostgreSQL"},
	"tidb":       {Group: GroupSQL, Label: "TiDB"},
	"oceanbase":  {Group: GroupSQL, Label: "OceanBase"},
	"redis":      {Group: GroupNoSQL, Label: "Redis"},
	"mongo":      {Group: GroupNoSQL, Label: "MongoDB"},
	"es":         {Group: GroupSearch, Label: "Elasticsearch"},
	"kafka":      {Group: GroupMQ, Label: "Kafka"},
}

// GetTypeGroup 获取数据源类型对应的分组
func GetTypeGroup(dsType string) TypeGroup {
	if def, ok := DatasourceTypes[dsType]; ok {
		return def.Group
	}
	return ""
}

// GetTypeGroups 返回按 group 分组的类型列表（供前端 API 使用）
func GetTypeGroups() []TypeGroupDef {
	groupMap := make(map[TypeGroup]*TypeGroupDef)
	for typeName, def := range DatasourceTypes {
		if _, ok := groupMap[def.Group]; !ok {
			label := ""
			switch def.Group {
			case GroupSQL:
				label = "SQL 数据库"
			case GroupNoSQL:
				label = "NoSQL"
			case GroupSearch:
				label = "搜索引擎"
			case GroupMQ:
				label = "消息队列"
			}
			groupMap[def.Group] = &TypeGroupDef{
				Group: string(def.Group),
				Label: label,
				Types: nil,
			}
		}
		groupMap[def.Group].Types = append(groupMap[def.Group].Types, TypeDef{
			Type:  typeName,
			Label: def.Label,
		})
	}
	result := make([]TypeGroupDef, 0, len(groupMap))
	for _, g := range groupMap {
		result = append(result, *g)
	}
	return result
}
