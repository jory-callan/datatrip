package audit

import (
	"context"
	"errors"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("audit log not found")
	ErrInvalidInput = errors.New("invalid input")
)

// CreateAuditLog creates an audit log entry (append-only).
func CreateAuditLog(ctx context.Context, req CreateAuditLogRequest) (*DTO, error) {
	if req.Action == "" {
		return nil, ErrInvalidInput
	}

	a := &AuditLog{
		ActorID:        req.ActorID,
		ProjectID:      req.ProjectID,
		DatasourceID:   req.DatasourceID,
		Action:         req.Action,
		Sql:            req.Sql,
		Classification: req.Classification,
		Status:         req.Status,
		DurationMs:     req.DurationMs,
		ErrorMessage:   req.ErrorMessage,
		TicketID:       req.TicketID,
		IP:             req.IP,
	}
	if a.Status == "" {
		a.Status = StatusPending
	}

	if err := Create(ctx, a); err != nil {
		return nil, err
	}
	return ToDTO(a), nil
}

// ListAuditLogs returns paginated audit logs.
func ListAuditLogs(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
	query.Normalize()
	items, total, err := List(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

// GetAuditLog returns a single audit log by ID.
func GetAuditLog(ctx context.Context, id uint) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	var a AuditLog
	if err := global.DB.WithContext(ctx).First(&a, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return ToDTO(&a), nil
}
