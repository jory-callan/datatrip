package escalation

import (
	"context"
	"errors"
	"time"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

var (
	ErrNotFound        = errors.New("escalation not found")
	ErrNoActiveEscalation = errors.New("no active escalation for this project")
)

func Create(ctx context.Context, e *Escalation) error {
	return global.DB.WithContext(ctx).Create(e).Error
}

func GetByID(ctx context.Context, id uint) (*Escalation, error) {
	var e Escalation
	err := global.DB.WithContext(ctx).First(&e, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	return &e, err
}

func Save(ctx context.Context, e *Escalation) error {
	return global.DB.WithContext(ctx).Save(e).Error
}

// GetActiveByUserAndProject returns the user's active (approved + not expired) escalation for a project.
func GetActiveByUserAndProject(ctx context.Context, userID, projectID uint) (*Escalation, error) {
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
func ListByScope(ctx context.Context, userID uint, q ListQuery) ([]Escalation, int64, error) {
	q.Normalize()
	db := global.DB.WithContext(ctx).Model(&Escalation{})

	switch q.Scope {
	case "my":
		db = db.Where("user_id = ?", userID)
	case "pending":
		// Pending escalations for projects where user is owner/admin
		db = db.Where("status = ?", StatusPending)
	default:
		// all — no filter
	}

	if q.ProjectID > 0 {
		db = db.Where("project_id = ?", q.ProjectID)
	}
	if q.Status != "" {
		db = db.Where("status = ?", q.Status)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []Escalation
	if err := db.Order("created_at DESC").
		Offset(q.Offset()).
		Limit(q.PageSize).
		Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// ExpireStale marks expired approved escalations as expired.
func ExpireStale(ctx context.Context) error {
	return global.DB.WithContext(ctx).
		Model(&Escalation{}).
		Where("status = ? AND expires_at < ?", StatusApproved, time.Now()).
		Update("status", StatusExpired).Error
}
