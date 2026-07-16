package userrole

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrNotFound      = errors.New("user role not found")
	ErrInvalidInput  = errors.New("invalid input")
	ErrAlreadyExists = errors.New("user already has this role")
)

type DTO struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	RoleID string `json:"role_id"`
}

func ToDTO(ur *UserRole) *DTO {
	if ur == nil {
		return nil
	}
	return &DTO{
		ID:     ur.ID,
		UserID: ur.UserID,
		RoleID: ur.RoleID,
	}
}

type AssignRequest struct {
	UserID string `json:"user_id"`
	RoleID string `json:"role_id"`
}

func AssignRole(ctx context.Context, req AssignRequest) (*DTO, error) {
	if req.UserID == "" || req.RoleID == "" {
		return nil, ErrInvalidInput
	}

	existing, _ := GetByUserAndRole(ctx, req.UserID, req.RoleID)
	if existing != nil {
		return nil, ErrAlreadyExists
	}

	ur := &UserRole{
		UserID: req.UserID,
		RoleID: req.RoleID,
	}
	if err := Create(ctx, ur); err != nil {
		return nil, err
	}
	return ToDTO(ur), nil
}

func UnassignRole(ctx context.Context, userID, roleID string) error {
	if userID == "" || roleID == "" {
		return ErrInvalidInput
	}
	if err := DeleteByUserAndRole(ctx, userID, roleID); errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return nil
}

func GetUserRoles(ctx context.Context, userID string) ([]*DTO, error) {
	if userID == "" {
		return nil, ErrInvalidInput
	}
	list, err := ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	items := make([]*DTO, 0, len(list))
	for i := range list {
		items = append(items, ToDTO(&list[i]))
	}
	return items, nil
}
