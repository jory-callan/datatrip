package role

import (
	"context"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, r *Role) error {
	return global.DB.WithContext(ctx).Create(r).Error
}

func GetByID(ctx context.Context, id string) (*Role, error) {
	var r Role
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&r).Error; err != nil {
		return nil, err
	}
	return &r, nil
}

func GetByCode(ctx context.Context, code string) (*Role, error) {
	var r Role
	if err := global.DB.WithContext(ctx).Where("code = ?", code).First(&r).Error; err != nil {
		return nil, err
	}
	return &r, nil
}

func List(ctx context.Context) ([]Role, error) {
	var list []Role
	if err := global.DB.WithContext(ctx).
		Model(&Role{}).
		Order("code asc").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func Save(ctx context.Context, r *Role) error {
	return global.DB.WithContext(ctx).Save(r).Error
}

func DeleteByID(ctx context.Context, id string) error {
	result := global.DB.WithContext(ctx).Where("id = ?", id).Delete(&Role{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func ExistsByCode(ctx context.Context, code string) (bool, error) {
	var count int64
	err := global.DB.WithContext(ctx).Model(&Role{}).
		Where("code = ?", code).
		Count(&count).Error
	return count > 0, err
}
