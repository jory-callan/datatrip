package snippet

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("snippet not found")
	ErrInvalidInput = errors.New("invalid input")
	ErrForbidden    = errors.New("forbidden")
)

func Create(ctx context.Context, s *Snippet) error {
	return global.DB.WithContext(ctx).Create(s).Error
}

func Update(ctx context.Context, s *Snippet) error {
	return global.DB.WithContext(ctx).Save(s).Error
}

func Delete(ctx context.Context, id string) error {
	return global.DB.WithContext(ctx).Where("id = ?", id).Delete(&Snippet{}).Error
}

func GetByID(ctx context.Context, id string) (*Snippet, error) {
	var s Snippet
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&s).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func List(ctx context.Context, query ListQuery) ([]Snippet, int64, error) {
	var items []Snippet
	var total int64
	db := global.DB.WithContext(ctx).Model(&Snippet{})

	if query.UserID != "" {
		db = db.Where("user_id = ?", query.UserID)
	}
	if query.DatasourceType != "" {
		db = db.Where("datasource_type = ?", query.DatasourceType)
	}
	keyword := strings.TrimSpace(query.Keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR content LIKE ?", like, like)
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

func ListByUser(ctx context.Context, userID string) ([]Snippet, error) {
	var items []Snippet
	if err := global.DB.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("id desc").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
