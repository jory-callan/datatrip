package sqlfavorite

import (
	"context"
	"errors"
	"strings"
)

func ListFavorites(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
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

func ListMyFavorites(ctx context.Context, userID uint) ([]*DTO, error) {
	items, err := ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, nil
}

func CreateFavorite(ctx context.Context, userID uint, req CreateRequest) (*DTO, error) {
	name := strings.TrimSpace(req.Name)
	sql := strings.TrimSpace(req.Sql)
	if name == "" || sql == "" {
		return nil, ErrInvalidInput
	}
	scope := req.Scope
	if scope == "" {
		scope = ScopePersonal
	}
	if scope != ScopePersonal && scope != ScopeTeam {
		return nil, ErrInvalidInput
	}

	f := &SqlFavorite{
		UserID:    userID,
		Name:      name,
		Sql:       sql,
		Scope:     scope,
		ProjectID: req.ProjectID,
		Database:  req.Database,
	}
	if err := Create(ctx, f); err != nil {
		return nil, err
	}
	return ToDTO(f), nil
}

func UpdateFavorite(ctx context.Context, id, userID uint, req UpdateRequest) (*DTO, error) {
	f, err := GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if f.UserID != userID {
		return nil, ErrForbidden
	}

	if req.Name != "" {
		f.Name = strings.TrimSpace(req.Name)
	}
	if req.Sql != "" {
		f.Sql = strings.TrimSpace(req.Sql)
	}
	if req.Scope != "" {
		f.Scope = req.Scope
	}
	f.Database = req.Database

	if err := Update(ctx, f); err != nil {
		return nil, err
	}
	return ToDTO(f), nil
}

func DeleteFavorite(ctx context.Context, id, userID uint) error {
	f, err := GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if f.UserID != userID && f.Scope != ScopeTeam {
		// Only owner or team templates can be deleted by system_admin
		return ErrForbidden
	}
	return Delete(ctx, id)
}
