package userrole

import (
	"context"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, ur *UserRole) error {
	return global.DB.WithContext(ctx).Create(ur).Error
}

func GetByUserAndRole(ctx context.Context, userID, roleID string) (*UserRole, error) {
	var ur UserRole
	err := global.DB.WithContext(ctx).
		Where("user_id = ? AND role_id = ?", userID, roleID).
		First(&ur).Error
	if err != nil {
		return nil, err
	}
	return &ur, nil
}

func ListByUser(ctx context.Context, userID string) ([]UserRole, error) {
	var list []UserRole
	if err := global.DB.WithContext(ctx).
		Where("user_id = ?", userID).
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func ListByRole(ctx context.Context, roleID string) ([]UserRole, error) {
	var list []UserRole
	if err := global.DB.WithContext(ctx).
		Where("role_id = ?", roleID).
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func Delete(ctx context.Context, id string) error {
	result := global.DB.WithContext(ctx).Where("id = ?", id).Delete(&UserRole{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func DeleteByUserAndRole(ctx context.Context, userID, roleID string) error {
	result := global.DB.WithContext(ctx).
		Where("user_id = ? AND role_id = ?", userID, roleID).
		Delete(&UserRole{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
