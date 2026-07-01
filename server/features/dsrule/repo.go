package dsrule

import (
	"context"
	"regexp"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"go.uber.org/zap"
)

func Create(ctx context.Context, r *DatasourceRule) error {
	return global.DB.WithContext(ctx).Create(r).Error
}

func Save(ctx context.Context, r *DatasourceRule) error {
	return global.DB.WithContext(ctx).Save(r).Error
}

func GetByID(ctx context.Context, id uint) (*DatasourceRule, error) {
	var r DatasourceRule
	if err := global.DB.WithContext(ctx).First(&r, id).Error; err != nil {
		return nil, err
	}
	return &r, nil
}

func List(ctx context.Context, query ListQuery) ([]DatasourceRule, int64, error) {
	var items []DatasourceRule
	var total int64
	db := global.DB.WithContext(ctx).Model(&DatasourceRule{})

	dbType := strings.TrimSpace(query.DBType)
	if dbType != "" {
		db = db.Where("db_type = ?", dbType)
	}
	category := strings.TrimSpace(query.Category)
	if category != "" {
		db = db.Where("category = ?", category)
	}
	if query.Enabled == "true" {
		db = db.Where("enabled = ?", true)
	} else if query.Enabled == "false" {
		db = db.Where("enabled = ?", false)
	}

	if query.NeedCount {
		if err := db.Count(&total).Error; err != nil {
			return nil, 0, err
		}
	}
	if err := db.Order("id desc").Offset(query.Offset()).Limit(query.PageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	if !query.NeedCount {
		total = int64(len(items))
	}
	return items, total, nil
}

func DeleteByID(ctx context.Context, id uint) error {
	return global.DB.WithContext(ctx).Delete(&DatasourceRule{}, id).Error
}

// GetRulesByIDs returns enabled rules matching the given IDs.
func GetRulesByIDs(ctx context.Context, ids []uint) ([]DatasourceRule, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rules []DatasourceRule
	if err := global.DB.WithContext(ctx).
		Where("id IN ? AND enabled = ?", ids, true).
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

// GetEnabledRulesByDBType returns all enabled rules matching the given db_type.
// Matches exact db_type or 'all' wildcard.
func GetEnabledRulesByDBType(ctx context.Context, dbType string) ([]DatasourceRule, error) {
	if dbType == "" {
		return nil, nil
	}
	var rules []DatasourceRule
	if err := global.DB.WithContext(ctx).
		Where("enabled = ? AND (db_type = ? OR db_type = 'all')", true, dbType).
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

// MatchRule checks if a SQL statement matches a DatasourceRule's pattern.
func MatchRule(rule *DatasourceRule, sqlStmt string) bool {
	re, err := regexp.Compile(rule.Pattern)
	if err != nil {
		global.Log.Warn("invalid sql rule pattern", zap.String("rule", rule.Name), zap.Error(err))
		return false
	}
	return re.MatchString(sqlStmt)
}
