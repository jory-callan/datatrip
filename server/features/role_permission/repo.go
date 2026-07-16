package rolepermission

import (
	"context"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, rp *RolePermission) error {
	return global.DB.WithContext(ctx).Create(rp).Error
}

func Delete(ctx context.Context, id string) error {
	result := global.DB.WithContext(ctx).Where("id = ?", id).Delete(&RolePermission{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func DeleteByRoleAndPermission(ctx context.Context, roleID, permissionID string) error {
	result := global.DB.WithContext(ctx).
		Where("role_id = ? AND permission_id = ?", roleID, permissionID).
		Delete(&RolePermission{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func ListByRole(ctx context.Context, roleID string) ([]RolePermission, error) {
	var list []RolePermission
	if err := global.DB.WithContext(ctx).
		Where("role_id = ?", roleID).
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func ListByPermission(ctx context.Context, permissionID string) ([]RolePermission, error) {
	var list []RolePermission
	if err := global.DB.WithContext(ctx).
		Where("permission_id = ?", permissionID).
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
