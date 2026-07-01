package audit

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
)

func Create(ctx context.Context, a *AuditLog) error {
	return global.DB.WithContext(ctx).Create(a).Error
}

func List(ctx context.Context, query ListQuery) ([]AuditLog, int64, error) {
	var items []AuditLog
	var total int64
	db := global.DB.WithContext(ctx).Model(&AuditLog{})

	if query.ActorID > 0 {
		db = db.Where("actor_id = ?", query.ActorID)
	}
	if query.ProjectID > 0 {
		db = db.Where("project_id = ?", query.ProjectID)
	}
	if query.DatasourceID > 0 {
		db = db.Where("datasource_id = ?", query.DatasourceID)
	}
	action := strings.TrimSpace(query.Action)
	if action != "" {
		db = db.Where("action = ?", action)
	}
	status := strings.TrimSpace(query.Status)
	if status != "" {
		db = db.Where("status = ?", status)
	}
	classification := strings.TrimSpace(query.Classification)
	if classification != "" {
		db = db.Where("classification = ?", classification)
	}
	startTime := strings.TrimSpace(query.StartTime)
	if startTime != "" {
		db = db.Where("created_at >= ?", startTime)
	}
	endTime := strings.TrimSpace(query.EndTime)
	if endTime != "" {
		db = db.Where("created_at <= ?", endTime)
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

func ListByTicketID(ctx context.Context, ticketID uint) ([]*DTO, error) {
	var items []AuditLog
	if err := global.DB.WithContext(ctx).
		Where("ticket_id = ?", ticketID).
		Order("id desc").
		Find(&items).Error; err != nil {
		return nil, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, nil
}
