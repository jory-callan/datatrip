package webhook

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
)

func CreateWebhookRepo(ctx context.Context, w *Webhook) error {
	return global.DB.WithContext(ctx).Create(w).Error
}

func SaveWebhookRepo(ctx context.Context, w *Webhook) error {
	return global.DB.WithContext(ctx).Save(w).Error
}

func GetWebhookByID(ctx context.Context, id string) (*Webhook, error) {
	var w Webhook
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&w).Error; err != nil {
		return nil, err
	}
	return &w, nil
}

func ListWebhooks(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]Webhook, int64, error) {
	var items []Webhook
	db := global.DB.WithContext(ctx).Model(&Webhook{})

	// 通用 filter（scope）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"scope": "scope",
	})

	// enabled — 特殊布尔处理
	if enabled := strings.TrimSpace(filters["enabled"]); enabled == "true" || enabled == "=true" {
		db = db.Where("enabled = ?", true)
	} else if enabled == "false" || enabled == "=false" {
		db = db.Where("enabled = ?", false)
	}

	total, err := queryfilter.Paginate(db.Order("id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func DeleteWebhookByID(ctx context.Context, id string) error {
	return global.DB.WithContext(ctx).Where("id = ?", id).Delete(&Webhook{}).Error
}

// ListEnabledWebhooksByEvent returns all enabled webhooks that match the given event.
func ListEnabledWebhooksByEvent(ctx context.Context, event string) ([]Webhook, error) {
	var items []Webhook
	if err := global.DB.WithContext(ctx).
		Where("enabled = ?", true).
		Where("events LIKE ?", "%"+event+"%").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
