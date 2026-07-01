package sqlfavorite

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("favorite not found")
	ErrInvalidInput = errors.New("invalid input")
	ErrForbidden    = errors.New("forbidden")
)

func Create(ctx context.Context, f *SqlFavorite) error {
	return global.DB.WithContext(ctx).Create(f).Error
}

func Update(ctx context.Context, f *SqlFavorite) error {
	return global.DB.WithContext(ctx).Save(f).Error
}

func Delete(ctx context.Context, id uint) error {
	return global.DB.WithContext(ctx).Delete(&SqlFavorite{}, id).Error
}

func GetByID(ctx context.Context, id uint) (*SqlFavorite, error) {
	var f SqlFavorite
	if err := global.DB.WithContext(ctx).First(&f, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &f, nil
}

func List(ctx context.Context, query ListQuery) ([]SqlFavorite, int64, error) {
	var items []SqlFavorite
	var total int64
	db := global.DB.WithContext(ctx).Model(&SqlFavorite{})

	if query.UserID > 0 {
		db = db.Where("user_id = ?", query.UserID)
	}
	scope := strings.TrimSpace(query.Scope)
	if scope != "" {
		db = db.Where("scope = ?", scope)
	}
	keyword := strings.TrimSpace(query.Keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR sql LIKE ?", like, like)
	}

	if query.NeedCount {
		if err := db.Count(&total).Error; err != nil {
			return nil, 0, err
		}
	}
	if err := db.Order("id desc").Offset(query.Offset()).Limit(query.PageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	if !query.NeedCount {
		total = int64(len(items))
	}
	return items, total, nil
}

func ListByUser(ctx context.Context, userID uint) ([]SqlFavorite, error) {
	var items []SqlFavorite
	if err := global.DB.WithContext(ctx).
		Where("user_id = ? OR scope = ?", userID, ScopeTeam).
		Order("id desc").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
