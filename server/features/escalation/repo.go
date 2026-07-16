package escalation

import (
	"context"
	"errors"
	"time"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
	"gorm.io/gorm"
)

var (
	ErrNotFound           = errors.New("escalation not found")
	ErrNoActiveEscalation = errors.New("no active escalation for this project")
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidInput       = errors.New("invalid input")
)

func Create(ctx context.Context, e *Escalation) error {
	return global.DB.WithContext(ctx).Create(e).Error
}

func GetByID(ctx context.Context, id string) (*Escalation, error) {
	var e Escalation
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&e).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &e, nil
}

func Save(ctx context.Context, e *Escalation) error {
	return global.DB.WithContext(ctx).Save(e).Error
}

// GetActiveByUserAndProject returns the user's active (approved + not expired) escalation for a project.
func GetActiveByUserAndProject(ctx context.Context, userID, projectID string) (*Escalation, error) {
	var e Escalation
	err := global.DB.WithContext(ctx).
		Where("user_id = ? AND project_id = ? AND status = ? AND expires_at > ?",
			userID, projectID, StatusApproved, time.Now()).
		First(&e).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNoActiveEscalation
	}
	return &e, err
}

// ListByScope lists escalations based on the query scope.
func ListByScope(ctx context.Context, userID string, pq response.PageQuery, filters map[string]string) ([]Escalation, int64, error) {
	var items []Escalation
	db := global.DB.WithContext(ctx).Model(&Escalation{})

	// scope — 特殊业务逻辑
	switch filters["scope"] {
	case "my":
		db = db.Where("user_id = ?", userID)
	case "pending":
		db = db.Where("status = ?", StatusPending)
	}

	// 通用 filter（project_id, status）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"project_id": "project_id",
		"status":     "status",
	})

	total, err := queryfilter.Paginate(db.Order("created_at DESC"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// DeleteByID soft-deletes an escalation by ID.
func DeleteByID(ctx context.Context, id string) error {
	result := global.DB.WithContext(ctx).Where("id = ?", id).Delete(&Escalation{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// ExpireStale marks expired approved escalations as expired.
func ExpireStale(ctx context.Context) error {
	return global.DB.WithContext(ctx).
		Model(&Escalation{}).
		Where("status = ? AND expires_at < ?", StatusApproved, time.Now()).
		Update("status", StatusExpired).Error
}
