package rolepermission

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrNotFound      = errors.New("role permission not found")
	ErrInvalidInput  = errors.New("invalid input")
	ErrAlreadyExists = errors.New("permission already assigned to role")
)

type DTO struct {
	ID           string `json:"id"`
	RoleID       string `json:"role_id"`
	PermissionID string `json:"permission_id"`
}

func ToDTO(rp *RolePermission) *DTO {
	if rp == nil {
		return nil
	}
	return &DTO{
		ID:           rp.ID,
		RoleID:       rp.RoleID,
		PermissionID: rp.PermissionID,
	}
}

type AssignRequest struct {
	PermissionID string `json:"permission_id"`
}

func AssignPermission(ctx context.Context, roleID string, req AssignRequest) (*DTO, error) {
	if roleID == "" || req.PermissionID == "" {
		return nil, ErrInvalidInput
	}

	list, err := ListByRole(ctx, roleID)
	if err != nil {
		return nil, err
	}
	for _, rp := range list {
		if rp.PermissionID == req.PermissionID {
			return nil, ErrAlreadyExists
		}
	}

	rp := &RolePermission{
		RoleID:       roleID,
		PermissionID: req.PermissionID,
	}
	if err := Create(ctx, rp); err != nil {
		return nil, err
	}
	return ToDTO(rp), nil
}

func UnassignPermission(ctx context.Context, roleID, permissionID string) error {
	if roleID == "" || permissionID == "" {
		return ErrInvalidInput
	}
	if err := DeleteByRoleAndPermission(ctx, roleID, permissionID); errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return nil
}

func GetRolePermissions(ctx context.Context, roleID string) ([]*DTO, error) {
	if roleID == "" {
		return nil, ErrInvalidInput
	}
	list, err := ListByRole(ctx, roleID)
	if err != nil {
		return nil, err
	}
	items := make([]*DTO, 0, len(list))
	for i := range list {
		items = append(items, ToDTO(&list[i]))
	}
	return items, nil
}
