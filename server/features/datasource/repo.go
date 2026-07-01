package datasource

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
)

func Create(ctx context.Context, d *Datasource) error {
	return global.DB.WithContext(ctx).Create(d).Error
}

func Save(ctx context.Context, d *Datasource) error {
	return global.DB.WithContext(ctx).Save(d).Error
}

func GetByID(ctx context.Context, id uint) (*Datasource, error) {
	var d Datasource
	if err := global.DB.WithContext(ctx).First(&d, id).Error; err != nil {
		return nil, err
	}
	return &d, nil
}

func List(ctx context.Context, query ListQuery) ([]Datasource, int64, error) {
	var items []Datasource
	var total int64
	db := global.DB.WithContext(ctx).Model(&Datasource{})

	keyword := strings.TrimSpace(query.Keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR host LIKE ?", like, like)
	}
	if query.Type != "" {
		db = db.Where("type = ?", query.Type)
	}
	if query.Status != "" {
		db = db.Where("status = ?", query.Status)
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

func DeleteByID(ctx context.Context, id uint) error {
	return global.DB.WithContext(ctx).Delete(&Datasource{}, id).Error
}
