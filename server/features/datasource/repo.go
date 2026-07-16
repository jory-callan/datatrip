package datasource

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
)

func Create(ctx context.Context, d *Datasource) error {
	return global.DB.WithContext(ctx).Create(d).Error
}

func Save(ctx context.Context, d *Datasource) error {
	return global.DB.WithContext(ctx).Save(d).Error
}

func GetByID(ctx context.Context, id string) (*Datasource, error) {
	var d Datasource
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&d).Error; err != nil {
		return nil, err
	}
	return &d, nil
}

func List(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]Datasource, int64, error) {
	var items []Datasource
	db := global.DB.WithContext(ctx).Model(&Datasource{})

	// keyword — 特殊多列搜索
	if keyword := strings.TrimSpace(filters["keyword"]); keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR host LIKE ?", like, like)
	}

	// 通用 filter
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"type":   "type",
		"status": "status",
	})

	total, err := queryfilter.Paginate(db.Order("id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func DeleteByID(ctx context.Context, id string) error {
	return global.DB.WithContext(ctx).Where("id = ?", id).Delete(&Datasource{}).Error
}

func DeleteByIDs(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return global.DB.WithContext(ctx).Delete(&Datasource{}, ids).Error
}
