package dsrule

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("sql rule not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListSqlRules(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
	query.Normalize()
	items, total, err := List(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

func GetSqlRule(ctx context.Context, id uint) (*DTO, error) {
	if id == 0 {
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
		Name:     name,
		DBType:   strings.TrimSpace(req.DBType),
		Category: category,
		Pattern:  pattern,
		Enabled:  req.Enabled,
	}
	if err := Create(ctx, r); err != nil {
		return nil, err
	}
	return GetSqlRule(ctx, r.ID)
}

func UpdateSqlRule(ctx context.Context, id uint, req UpdateRequest) (*DTO, error) {
	if id == 0 {
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

	if err := Save(ctx, r); err != nil {
		return nil, err
	}
	return GetSqlRule(ctx, r.ID)
}

func DeleteSqlRule(ctx context.Context, id uint) error {
	if id == 0 {
		return ErrInvalidInput
	}
	err := DeleteByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

// ListEnabledRulesForProject returns enabled rules for a given project's DB type.
func ListEnabledRulesForProject(ctx context.Context, dbType string) ([]*DTO, error) {
	q := ListQuery{}
	q.PageSize = 2000
	q.Enabled = "true"
	q.DBType = dbType
	items, _, err := List(ctx, q)
	if err != nil {
		global.Log.Warn("list enabled rules for project failed")
		return nil, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, nil
}
