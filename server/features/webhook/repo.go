package webhook

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
)

func CreateWebhookRepo(ctx context.Context, w *Webhook) error {
	return global.DB.WithContext(ctx).Create(w).Error
}

func SaveWebhookRepo(ctx context.Context, w *Webhook) error {
	return global.DB.WithContext(ctx).Save(w).Error
}

func GetWebhookByID(ctx context.Context, id uint) (*Webhook, error) {
	var w Webhook
	if err := global.DB.WithContext(ctx).First(&w, id).Error; err != nil {
		return nil, err
	}
	return &w, nil
}

func ListWebhooks(ctx context.Context, query ListQuery) ([]Webhook, int64, error) {
	var items []Webhook
	var total int64
	db := global.DB.WithContext(ctx).Model(&Webhook{})

	scope := strings.TrimSpace(query.Scope)
	if scope != "" {
		db = db.Where("scope = ?", scope)
	}
	if query.Enabled == "true" {
		db = db.Where("enabled = ?", true)
	} else if query.Enabled == "false" {
		db = db.Where("enabled = ?", false)
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

func DeleteWebhookByID(ctx context.Context, id uint) error {
	return global.DB.WithContext(ctx).Delete(&Webhook{}, id).Error
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
