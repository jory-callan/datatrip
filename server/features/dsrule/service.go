package dsrule

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/pipeline"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("sql rule not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListSqlRules(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
	items, total, err := List(ctx, pq, filters)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

func GetSqlRule(ctx context.Context, id string) (*DTO, error) {
	if id == "" {
		return nil, ErrInvalidInput
	}
	r, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(r), nil
}

func CreateSqlRule(ctx context.Context, req CreateRequest) (*DTO, error) {
	name := strings.TrimSpace(req.Name)
	category := strings.TrimSpace(req.Category)
	pattern := strings.TrimSpace(req.Pattern)

	if name == "" || category == "" || pattern == "" {
		return nil, ErrInvalidInput
	}
	if category != CategoryRead && category != CategoryWrite && category != CategoryDangerous {
		return nil, ErrInvalidInput
	}

	r := &DatasourceRule{
		Name:      name,
		TypeGroup: strings.TrimSpace(req.TypeGroup),
		TypeScope: strings.TrimSpace(req.TypeScope),
		Category:  category,
		Pattern:   pattern,
		Enabled:   req.Enabled,
		Priority:  req.Priority,
	}
	if err := Create(ctx, r); err != nil {
		return nil, err
	}
	return GetSqlRule(ctx, r.ID)
}

func UpdateSqlRule(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
	if id == "" {
		return nil, ErrInvalidInput
	}
	r, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		r.Name = req.Name
	}
	if req.TypeScope != "" {
		if req.TypeGroup != "" {
			r.TypeGroup = req.TypeGroup
		}
	}
	if req.Category != "" {
		if req.Category != CategoryRead && req.Category != CategoryWrite && req.Category != CategoryDangerous {
			return nil, ErrInvalidInput
		}
		r.Category = req.Category
	}
	if req.Pattern != "" {
		r.Pattern = req.Pattern
	}
	if req.Enabled != nil {
		r.Enabled = *req.Enabled
	}
	if req.Priority != nil {
		r.Priority = *req.Priority
	}

	if err := Save(ctx, r); err != nil {
		return nil, err
	}
	return GetSqlRule(ctx, r.ID)
}

func DeleteSqlRule(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	err := DeleteByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

func BatchDeleteSqlRules(ctx context.Context, ids []string) error {
	cleanIDs := make([]string, 0, len(ids))
	for _, id := range ids {
		if strings.TrimSpace(id) != "" {
			cleanIDs = append(cleanIDs, strings.TrimSpace(id))
		}
	}
	if len(cleanIDs) == 0 {
		return ErrInvalidInput
	}
	return DeleteByIDs(ctx, cleanIDs)
}

// ListEnabledRulesForProject returns enabled rules matching the project's DB type.
func ListEnabledRulesForProject(ctx context.Context, dsType, dsGroup string) ([]*DTO, error) {
	rules, err := GetEnabledRulesByTypeScope(ctx, dsType, dsGroup)
	if err != nil {
		global.Log.Warn("list enabled rules for project failed")
		return nil, err
	}
	result := make([]*DTO, 0, len(rules))
	for i := range rules {
		result = append(result, ToDTO(&rules[i]))
	}
	return result, nil
}

// === pipeline.RuleEngine implementation ===

// RuleEngine implements pipeline.RuleEngine
type RuleEngine struct{}

func NewRuleEngine() *RuleEngine {
	return &RuleEngine{}
}

func (e *RuleEngine) Evaluate(ctx context.Context, dsType, dsGroup string, insts []pipeline.Instruction) ([]pipeline.RuleResult, error) {
	rules, err := GetEnabledRulesByTypeScope(ctx, dsType, dsGroup)
	if err != nil {
		return nil, err
	}

	results := make([]pipeline.RuleResult, len(insts))
	for i, inst := range insts {
		result := pipeline.RuleResult{}
		for _, rule := range rules {
			if MatchRule(&rule, inst.Raw) {
				result.Matched = true
				result.RuleName = rule.Name
				// Map dsrule category to pipeline action
				switch rule.Category {
				case CategoryDangerous:
					if inst.OpType != pipeline.OpDangerous {
						result.Overridden = true
					}
					result.Action = pipeline.RuleActionBlock
				case CategoryWrite:
					if inst.OpType != pipeline.OpWrite && inst.OpType != pipeline.OpDangerous {
						result.Overridden = true
					}
					result.Action = pipeline.RuleActionTicket
				default: // read
					if inst.OpType != pipeline.OpRead {
						result.Overridden = true
					}
					result.Action = pipeline.RuleActionAllow
				}
				break // first match wins (sorted by priority asc)
			}
		}
		results[i] = result
	}
	return results, nil
}
