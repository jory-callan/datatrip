package ticket

import (
	"context"
	"errors"
	"strings"
	"time"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, t *Ticket) error {
	return global.DB.WithContext(ctx).Create(t).Error
}

func SaveTicket(ctx context.Context, t *Ticket) error {
	return global.DB.WithContext(ctx).Save(t).Error
}

func GetTicketByID(ctx context.Context, id uint) (*Ticket, error) {
	var t Ticket
	if err := global.DB.WithContext(ctx).First(&t, id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func ListTickets(ctx context.Context, query ListQuery) ([]Ticket, int64, error) {
	var items []Ticket
	var total int64
	db := global.DB.WithContext(ctx).Model(&Ticket{})

	if query.ProjectID > 0 {
		db = db.Where("project_id = ?", query.ProjectID)
	}
	status := strings.TrimSpace(query.Status)
	if status != "" {
		db = db.Where("status = ?", status)
	}
	scope := strings.TrimSpace(query.Scope)

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
	// Filter by scope after fetch (scope filters use applicant_id which is passed differently)
	// Scope filtering is handled by the caller
	_ = scope
	return items, total, nil
}

func ListTicketsByApplicant(ctx context.Context, applicantID uint, query ListQuery) ([]Ticket, int64, error) {
	var items []Ticket
	var total int64
	db := global.DB.WithContext(ctx).Model(&Ticket{})

	if applicantID > 0 {
		db = db.Where("applicant_id = ?", applicantID)
	}
	if query.ProjectID > 0 {
		db = db.Where("project_id = ?", query.ProjectID)
	}
	status := strings.TrimSpace(query.Status)
	if status != "" {
		db = db.Where("status = ?", status)
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

// Approval record queries

func CreateApprovalRecord(ctx context.Context, a *ApprovalRecord) error {
	return global.DB.WithContext(ctx).Create(a).Error
}

func ListApprovalRecords(ctx context.Context, ticketID uint) ([]ApprovalRecord, error) {
	var items []ApprovalRecord
	if err := global.DB.WithContext(ctx).
		Where("ticket_id = ?", ticketID).
		Order("id asc").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func CountApprovedRecords(ctx context.Context, ticketID uint) (int64, error) {
	var count int64
	if err := global.DB.WithContext(ctx).Model(&ApprovalRecord{}).
		Where("ticket_id = ? AND action = ?", ticketID, "approved").
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func HasRejection(ctx context.Context, ticketID uint) (bool, error) {
	var count int64
	if err := global.DB.WithContext(ctx).Model(&ApprovalRecord{}).
		Where("ticket_id = ? AND action = ?", ticketID, "rejected").
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetLastUrgeTime returns the time of the last urge for a ticket, or nil if none.
func GetLastUrgeTime(ctx context.Context, ticketID uint) (*time.Time, error) {
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
