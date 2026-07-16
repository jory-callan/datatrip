package user

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
	"gorm.io/gorm"
)

func Create(ctx context.Context, u *User) error {
	return global.DB.WithContext(ctx).Create(u).Error
}

func Save(ctx context.Context, u *User) error {
	return global.DB.WithContext(ctx).Save(u).Error
}

func GetByID(ctx context.Context, id string) (*User, error) {
	var u User
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func List(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]User, int64, error) {
	var users []User
	db := global.DB.WithContext(ctx).Model(&User{})

	// keyword — 特殊多列搜索
	if keyword := strings.TrimSpace(filters["keyword"]); keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("username LIKE ? OR nickname LIKE ? OR email LIKE ?", like, like, like)
	}

	// 通用 filter
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"status": "status",
	})

	total, err := queryfilter.Paginate(db.Order("id asc"), pq.Page, pq.PageSize, pq.NeedCount, &users)
	if err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func ListByIDs(ctx context.Context, ids []string) ([]User, error) {
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

func DeleteByID(ctx context.Context, id string) error {
	result := global.DB.WithContext(ctx).Where("id = ?", id).Delete(&User{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func DeleteByIDs(ctx context.Context, ids []string) error {
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
