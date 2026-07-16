package snippet

import (
	"context"
	"errors"
	"strings"
)

func ListSnippets(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
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

func ListMySnippets(ctx context.Context, userID string) ([]*DTO, error) {
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

func CreateSnippet(ctx context.Context, userID string, req CreateRequest) (*DTO, error) {
	name := strings.TrimSpace(req.Name)
	content := strings.TrimSpace(req.Content)
	if name == "" || content == "" {
		return nil, ErrInvalidInput
	}
	if req.DatasourceType == "" {
		return nil, ErrInvalidInput
	}

	s := &Snippet{
		UserID:         userID,
		Name:           name,
		Content:        content,
		DatasourceType: req.DatasourceType,
	}
	if err := Create(ctx, s); err != nil {
		return nil, err
	}
	return ToDTO(s), nil
}

func UpdateSnippet(ctx context.Context, id, userID string, req UpdateRequest) (*DTO, error) {
	s, err := GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if s.UserID != userID {
		return nil, ErrForbidden
	}

	if req.Name != "" {
		s.Name = strings.TrimSpace(req.Name)
	}
	if req.Content != "" {
		s.Content = strings.TrimSpace(req.Content)
	}
	if req.DatasourceType != "" {
		s.DatasourceType = req.DatasourceType
	}

	if err := Update(ctx, s); err != nil {
		return nil, err
	}
	return ToDTO(s), nil
}

func DeleteSnippet(ctx context.Context, id, userID string) error {
	s, err := GetByID(ctx, id)
	if errors.Is(err, ErrNotFound) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if s.UserID != userID {
		return ErrForbidden
	}
	return Delete(ctx, id)
}
