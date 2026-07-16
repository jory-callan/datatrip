package ticket

import (
	"context"
	"errors"
	"time"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
	"gorm.io/gorm"
)

func Create(ctx context.Context, t *Ticket) error {
	return global.DB.WithContext(ctx).Create(t).Error
}

func SaveTicket(ctx context.Context, t *Ticket) error {
	return global.DB.WithContext(ctx).Save(t).Error
}

func GetTicketByID(ctx context.Context, id string) (*Ticket, error) {
	var t Ticket
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func ListTickets(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]Ticket, int64, error) {
	var items []Ticket
	db := global.DB.WithContext(ctx).Model(&Ticket{})

	// 通用 filter（project_id, status）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"project_id": "project_id",
		"status":     "status",
	})

	// scope — 特殊业务逻辑，由 service 层处理
	_ = filters["scope"]

	total, err := queryfilter.Paginate(db.Order("id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func ListTicketsByApplicant(ctx context.Context, applicantID string, pq response.PageQuery, filters map[string]string) ([]Ticket, int64, error) {
	var items []Ticket
	db := global.DB.WithContext(ctx).Model(&Ticket{})

	if applicantID != "" {
		db = db.Where("applicant_id = ?", applicantID)
	}

	// 通用 filter（project_id, status）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"project_id": "project_id",
		"status":     "status",
	})

	total, err := queryfilter.Paginate(db.Order("id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

// Approval record queries

func CreateApprovalRecord(ctx context.Context, a *ApprovalRecord) error {
	return global.DB.WithContext(ctx).Create(a).Error
}

func ListApprovalRecords(ctx context.Context, ticketID string) ([]ApprovalRecord, error) {
	var items []ApprovalRecord
	if err := global.DB.WithContext(ctx).
		Where("ticket_id = ?", ticketID).
		Order("id asc").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func CountApprovedRecords(ctx context.Context, ticketID string) (int64, error) {
	var count int64
	if err := global.DB.WithContext(ctx).Model(&ApprovalRecord{}).
		Where("ticket_id = ? AND action = ?", ticketID, "approved").
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func HasRejection(ctx context.Context, ticketID string) (bool, error) {
	var count int64
	if err := global.DB.WithContext(ctx).Model(&ApprovalRecord{}).
		Where("ticket_id = ? AND action = ?", ticketID, "rejected").
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetLastUrgeTime returns the time of the last urge for a ticket, or nil if none.
func GetLastUrgeTime(ctx context.Context, ticketID string) (*time.Time, error) {
	var record ApprovalRecord
	if err := global.DB.WithContext(ctx).
		Where("ticket_id = ? AND action = ?", ticketID, "urged").
		Order("id desc").
		First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &record.CreatedAt, nil
}
