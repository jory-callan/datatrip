package role

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("role not found")
	ErrInvalidInput = errors.New("invalid input")
	ErrCodeExists   = errors.New("role code already exists")
)

func ListRoles(ctx context.Context) ([]*DTO, error) {
	list, err := List(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]*DTO, 0, len(list))
	for i := range list {
		items = append(items, ToDTO(&list[i]))
	}
	return items, nil
}

func GetRole(ctx context.Context, id string) (*DTO, error) {
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

func CreateRole(ctx context.Context, req CreateRequest) (*DTO, error) {
	code := strings.TrimSpace(req.Code)
	name := strings.TrimSpace(req.Name)

	if code == "" || name == "" {
		return nil, ErrInvalidInput
	}

	exists, err := ExistsByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCodeExists
	}

	r := &Role{
		Code:        code,
		Name:        name,
		Description: strings.TrimSpace(req.Description),
	}

	if err := Create(ctx, r); err != nil {
		return nil, err
	}
	r, err = GetByID(ctx, r.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(r), nil
}

func UpdateRole(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
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
	if req.Description != "" {
		r.Description = req.Description
	}

	if err := Save(ctx, r); err != nil {
		return nil, err
	}
	r, err = GetByID(ctx, r.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(r), nil
}

func DeleteRole(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	if err := DeleteByID(ctx, id); errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return nil
}
