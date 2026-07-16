package queryfilter

import (
	"strings"

	"gorm.io/gorm"
)

// Filter 表示一个解析后的筛选条件，值已安全剥离，适合参数化查询
type Filter struct {
	Operator string   // =, LIKE, IN, >=, <=, >, <, BETWEEN
	Values   []string // 参数化查询的安全值
}

// Parse 将约定前缀的筛选值解析为 Filter。
// 空值或 "_all" 返回 nil（跳过该筛选）。
//
// 支持的约定前缀：
//
//	=value        精确匹配
//	=～*val*      LIKE（* 转 %，同时支持 ASCII =~）
//	=[a,b]        IN
//	=gte:val      大于等于
//	=lte:val      小于等于
//	=gt:val       大于
//	=lt:val       小于
//	=between:a,b  BETWEEN
//	_all 或空      跳过
//	无前缀         向后兼容，当作精确匹配
func Parse(value string) *Filter {
	v := strings.TrimSpace(value)
	if v == "" || v == "_all" {
		return nil
	}

	// =～*val* 或 =~*val* — LIKE（兼容全角波浪号和 ASCII 波浪号）
	if strings.HasPrefix(v, "=～") {
		raw := v[len("=～"):]
		likeVal := strings.ReplaceAll(raw, "*", "%")
		return &Filter{Operator: "LIKE", Values: []string{likeVal}}
	}
	if strings.HasPrefix(v, "=~") {
		raw := v[2:]
		likeVal := strings.ReplaceAll(raw, "*", "%")
		return &Filter{Operator: "LIKE", Values: []string{likeVal}}
	}

	// =[a,b,c] — IN
	if len(v) >= 3 && strings.HasPrefix(v, "=[") && strings.HasSuffix(v, "]") {
		inner := v[2 : len(v)-1]
		if inner == "" {
			return nil
		}
		vals := strings.Split(inner, ",")
		return &Filter{Operator: "IN", Values: vals}
	}

	// =gte:val
	if len(v) > 5 && strings.HasPrefix(v, "=gte:") {
		return &Filter{Operator: ">=", Values: []string{v[5:]}}
	}
	// =lte:val
	if len(v) > 5 && strings.HasPrefix(v, "=lte:") {
		return &Filter{Operator: "<=", Values: []string{v[5:]}}
	}
	// =gt:val
	if len(v) > 4 && strings.HasPrefix(v, "=gt:") {
		return &Filter{Operator: ">", Values: []string{v[4:]}}
	}
	// =lt:val
	if len(v) > 4 && strings.HasPrefix(v, "=lt:") {
		return &Filter{Operator: "<", Values: []string{v[4:]}}
	}
	// =between:a,b
	if len(v) > 9 && strings.HasPrefix(v, "=between:") {
		parts := strings.SplitN(v[9:], ",", 2)
		if len(parts) == 2 {
			return &Filter{Operator: "BETWEEN", Values: parts}
		}
		return nil
	}

	// =value — 精确匹配（必须在所有 =prefix 判断之后）
	if strings.HasPrefix(v, "=") {
		return &Filter{Operator: "=", Values: []string{v[1:]}}
	}

	// 无前缀 — 向后兼容当作精确匹配
	return &Filter{Operator: "=", Values: []string{v}}
}

// ApplyToDB 将一个已解析的 Filter 应用到 GORM 查询链上。
// columnMap 将前端参数名安全地映射到数据库列名，不在映射中的参数被忽略（防注入）。
func ApplyToDB(db *gorm.DB, paramName string, filter *Filter, columnMap map[string]string) *gorm.DB {
	col, ok := columnMap[paramName]
	if !ok {
		return db
	}

	switch filter.Operator {
	case "=":
		return db.Where(col+" = ?", filter.Values[0])
	case "LIKE":
		return db.Where(col+" LIKE ?", filter.Values[0])
	case "IN":
		return db.Where(col+" IN ?", filter.Values)
	case ">=":
		return db.Where(col+" >= ?", filter.Values[0])
	case "<=":
		return db.Where(col+" <= ?", filter.Values[0])
	case ">":
		return db.Where(col+" > ?", filter.Values[0])
	case "<":
		return db.Where(col+" < ?", filter.Values[0])
	case "BETWEEN":
		return db.Where(col+" BETWEEN ? AND ?", filter.Values[0], filter.Values[1])
	default:
		return db
	}
}

// ApplyAll 将 filters 映射中的所有参数通过 columnMap 应用到 GORM 查询。
// 不在 columnMap 中的参数静默忽略（防注入）。
func ApplyAll(db *gorm.DB, filters map[string]string, columnMap map[string]string) *gorm.DB {
	for paramName, value := range filters {
		filter := Parse(value)
		if filter == nil {
			continue
		}
		db = ApplyToDB(db, paramName, filter, columnMap)
	}
	return db
}
