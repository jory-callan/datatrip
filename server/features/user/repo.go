package user

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, u *User) error {
	return global.DB.WithContext(ctx).Create(u).Error
}

func Save(ctx context.Context, u *User) error {
	return global.DB.WithContext(ctx).Save(u).Error
}

func GetByID(ctx context.Context, id uint) (*User, error) {
	var u User
	if err := global.DB.WithContext(ctx).First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func List(ctx context.Context, query ListQuery) ([]User, int64, error) {
	var users []User
	var total int64
	db := global.DB.WithContext(ctx).Model(&User{})

	keyword := strings.TrimSpace(query.Keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("username LIKE ? OR nickname LIKE ?", like, like)
	}
	status := strings.TrimSpace(query.Status)
	if status != "" {
		db = db.Where("status = ?", status)
	}
	roleCode := strings.TrimSpace(query.RoleCode)
	if roleCode != "" {
		db = db.Where("role_code = ?", roleCode)
	}

	if query.NeedCount {
		if err := db.Count(&total).Error; err != nil {
			return nil, 0, err
		}
	}
	if err := db.Order("id asc").Offset(query.Offset()).Limit(query.PageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	if !query.NeedCount {
		total = int64(len(users))
	}
	return users, total, nil
}

func ListByIDs(ctx context.Context, ids []uint) ([]User, error) {
	if len(ids) == 0 {
		return []User{}, nil
	}
	var users []User
	if err := global.DB.WithContext(ctx).
		Where("id IN ?", ids).
		Order("id asc").
		Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func DeleteByID(ctx context.Context, id uint) error {
	result := global.DB.WithContext(ctx).Delete(&User{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func DeleteByIDs(ctx context.Context, ids []uint) error {
	if len(ids) == 0 {
		return nil
	}
	return global.DB.WithContext(ctx).Delete(&User{}, ids).Error
}

func FindByUsername(ctx context.Context, username string) (*User, error) {
	var u User
	if err := global.DB.WithContext(ctx).
		Where("username = ?", username).
		First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func ExistsByUsername(ctx context.Context, username string) (bool, error) {
	return ExistsByUsernameExceptID(ctx, username, 0)
}

func ExistsByUsernameExceptID(ctx context.Context, username string, exceptID uint) (bool, error) {
	var u User
	db := global.DB.WithContext(ctx).
		Select("id").
		Where("username = ?", username)
	if exceptID > 0 {
		db = db.Where("id <> ?", exceptID)
	}
	err := db.First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}
