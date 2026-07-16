package dsrule

import (
	"context"
	"regexp"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
	"go.uber.org/zap"
)

func Create(ctx context.Context, r *DatasourceRule) error {
	return global.DB.WithContext(ctx).Create(r).Error
}

func Save(ctx context.Context, r *DatasourceRule) error {
	return global.DB.WithContext(ctx).Save(r).Error
}

func GetByID(ctx context.Context, id string) (*DatasourceRule, error) {
	var r DatasourceRule
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&r).Error; err != nil {
		return nil, err
	}
	return &r, nil
}

func List(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]DatasourceRule, int64, error) {
	var items []DatasourceRule
	db := global.DB.WithContext(ctx).Model(&DatasourceRule{})

	// 通用 filter（type_group, type_scope, category）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"type_group": "type_group",
		"type_scope": "type_scope",
		"category":   "category",
	})

	// enabled — 特殊布尔处理
	if enabled := strings.TrimSpace(filters["enabled"]); enabled == "true" || enabled == "=true" {
		db = db.Where("enabled = ?", true)
	} else if enabled == "false" || enabled == "=false" {
		db = db.Where("enabled = ?", false)
	}

	total, err := queryfilter.Paginate(db.Order("priority asc, id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func DeleteByID(ctx context.Context, id string) error {
	return global.DB.WithContext(ctx).Where("id = ?", id).Delete(&DatasourceRule{}).Error
}

func DeleteByIDs(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return global.DB.WithContext(ctx).Delete(&DatasourceRule{}, ids).Error
}

// GetRulesByIDs 根据 ID 列表返回启用的规则
func GetRulesByIDs(ctx context.Context, ids []uint) ([]DatasourceRule, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rules []DatasourceRule
	if err := global.DB.WithContext(ctx).
		Where("id IN ? AND enabled = ?", ids, true).
		Order("priority asc").
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

// GetEnabledRulesByTypeScope 返回启用且匹配 type_group/type_scope 的规则。
func GetEnabledRulesByTypeScope(ctx context.Context, dsType, dsGroup string) ([]DatasourceRule, error) {
	var rules []DatasourceRule
	db := global.DB.WithContext(ctx).
		Model(&DatasourceRule{}).
		Where("enabled = ?", true)
	db = db.Where("(type_group = ? OR type_group = \"\") AND (type_scope = ? OR type_scope = \"\")",
		dsGroup, dsType)
	if err := db.Order("priority asc").Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

// MatchRule 检查 SQL 语句是否匹配规则的正则模式
func MatchRule(rule *DatasourceRule, sqlStmt string) bool {
	re, err := regexp.Compile(rule.Pattern)
	if err != nil {
		global.Log.Warn("invalid sql rule pattern", zap.String("rule", rule.Name), zap.Error(err))
		return false
	}
	return re.MatchString(sqlStmt)
}
