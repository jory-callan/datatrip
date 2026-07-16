package project

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/queryfilter"
	"gorm.io/gorm"
)

func Create(ctx context.Context, p *DataProject) error {
	return global.DB.WithContext(ctx).Create(p).Error
}

func Save(ctx context.Context, p *DataProject) error {
	return global.DB.WithContext(ctx).Save(p).Error
}

func GetByID(ctx context.Context, id string) (*DataProject, error) {
	var p DataProject
	if err := global.DB.WithContext(ctx).Where("id = ?", id).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func List(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]DataProject, int64, error) {
	var items []DataProject
	db := global.DB.WithContext(ctx).Model(&DataProject{})

	// keyword — 特殊多列搜索
	if keyword := strings.TrimSpace(filters["keyword"]); keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ?", like)
	}

	// 通用 filter（datasource_id）
	db = queryfilter.ApplyAll(db, filters, map[string]string{
		"datasource_id": "datasource_id",
	})

	// project_admin_id — 特殊子查询
	if adminID := strings.TrimSpace(filters["project_admin_id"]); adminID != "" {
		db = db.Where("id IN (SELECT project_id FROM data_project_member WHERE user_id = ? AND role = ?)", adminID, MemberRoleAdmin)
	}

	total, err := queryfilter.Paginate(db.Order("id desc"), pq.Page, pq.PageSize, pq.NeedCount, &items)
	if err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func DeleteByID(ctx context.Context, id string) error {
	return global.DB.WithContext(ctx).Where("id = ?", id).Delete(&DataProject{}).Error
}

func DeleteByIDs(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return global.DB.WithContext(ctx).Delete(&DataProject{}, ids).Error
}

// Member queries

func ListMembers(ctx context.Context, projectID string) ([]DataProjectMember, error) {
	var members []DataProjectMember
	if err := global.DB.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("id asc").
		Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func ReplaceMembers(ctx context.Context, projectID string, members []DataProjectMember) error {
	return global.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("project_id = ?", projectID).Delete(&DataProjectMember{}).Error; err != nil {
			return err
		}
		if len(members) > 0 {
			if err := tx.Create(&members).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func GetMemberRole(ctx context.Context, projectID, userID string) (string, error) {
	var m DataProjectMember
	if err := global.DB.WithContext(ctx).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		First(&m).Error; err != nil {
		return "", err
	}
	return m.Role, nil
}
