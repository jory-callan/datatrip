package webhook

import (
	"context"
	"time"

	"czwlinux.cloud/go-friday-starter/global"
)

func CreateDeliveryLog(ctx context.Context, log *DeliveryLog) error {
	return global.DB.WithContext(ctx).Create(log).Error
}

func ListDeliveryLogs(ctx context.Context, webhookID uint, page, pageSize int) ([]DeliveryLog, int64, error) {
	var items []DeliveryLog
	var total int64
	db := global.DB.WithContext(ctx).Model(&DeliveryLog{}).Where("webhook_id = ?", webhookID)

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := db.Order("id desc").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// CleanupOldDeliveryLogs deletes delivery logs older than 30 days.
func CleanupOldDeliveryLogs() {
	cutoff := time.Now().AddDate(0, 0, -30)
	global.DB.Where("created_at < ?", cutoff).Delete(&DeliveryLog{})
}
