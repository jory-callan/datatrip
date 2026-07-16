package permission

import (
	"context"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, p *Permission) error {
	return global.DB.WithContext(ctx).Create(p).Error
}

func GetByID(ctx context.Context, id string) (*Permission, error) {
	var p Permission
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func GetByCode(ctx context.Context, code string) (*Permission, error) {
	var p Permission
	if err := global.DB.WithContext(ctx).Where("code = ?", code).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func List(ctx context.Context, module string) ([]Permission, error) {
	db := global.DB.WithContext(ctx).Model(&Permission{})
	if module != "" {
		db = db.Where("module = ?", module)
	}
	var list []Permission
	if err := db.Order("code asc").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func DeleteByID(ctx context.Context, id string) error {
	result := global.DB.WithContext(ctx).Where("id = ?", id).Delete(&Permission{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func Save(ctx context.Context, p *Permission) error {
	return global.DB.WithContext(ctx).Save(p).Error
}

func ExistsByCode(ctx context.Context, code string) (bool, error) {
	var count int64
	err := global.DB.WithContext(ctx).Model(&Permission{}).
		Where("code = ?", code).
		Count(&count).Error
	return count > 0, err
}
