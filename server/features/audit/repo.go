package audit

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
)

func Create(ctx context.Context, a *AuditLog) error {
	return global.DB.WithContext(ctx).Create(a).Error
}

func List(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]AuditLog, int64, error) {
	var items []AuditLog
	db := global.DB.WithContext(ctx).Model(&AuditLog{})

	// 通用 filter（actor_id, project_id, datasource_id, action, status, classification）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"actor_id":       "actor_id",
		"project_id":     "project_id",
		"datasource_id":  "datasource_id",
		"action":         "action",
		"status":         "status",
		"classification": "classification",
	})

	// start_time / end_time — 特殊时间范围（前端传纯值，不是约定前缀）
	if startTime := strings.TrimSpace(filters["start_time"]); startTime != "" {
		db = db.Where("created_at >= ?", startTime)
	}
	if endTime := strings.TrimSpace(filters["end_time"]); endTime != "" {
		db = db.Where("created_at <= ?", endTime)
	}

	total, err := queryfilter.Paginate(db.Order("id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func ListByTicketID(ctx context.Context, ticketID string) ([]*DTO, error) {
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
