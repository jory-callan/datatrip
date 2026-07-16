package audit

import (
	"context"
	"errors"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("audit log not found")
	ErrInvalidInput = errors.New("invalid input")
)

func CreateAuditLog(ctx context.Context, req CreateAuditLogRequest) (*DTO, error) {
	if req.Action == "" {
		return nil, ErrInvalidInput
	}

	a := &AuditLog{
		ActorID:         req.ActorID,
		ProjectID:       req.ProjectID,
		DatasourceID:    req.DatasourceID,
		Action:          req.Action,
		RawText:         req.RawText,
		InstructionJSON: req.InstructionJSON,
		Classification:  req.Classification,
		Status:          req.Status,
		DurationMs:      req.DurationMs,
		ErrorMessage:    req.ErrorMessage,
		TicketID:        req.TicketID,
		IP:              req.IP,
	}
	if a.Status == "" {
		a.Status = StatusPending
	}

	if err := Create(ctx, a); err != nil {
		return nil, err
	}
	return ToDTO(a), nil
}

func ListAuditLogs(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
	items, total, err := List(ctx, pq, filters)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

func GetAuditLog(ctx context.Context, id string) (*DTO, error) {
	if id == "" {
		return nil, ErrInvalidInput
	}
	var a AuditLog
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&a).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return ToDTO(&a), nil
}
