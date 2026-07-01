package project

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"gorm.io/gorm"
)

func Create(ctx context.Context, p *DbProject) error {
	return global.DB.WithContext(ctx).Create(p).Error
}

func Save(ctx context.Context, p *DbProject) error {
	return global.DB.WithContext(ctx).Save(p).Error
}

func GetByID(ctx context.Context, id uint) (*DbProject, error) {
	var p DbProject
	if err := global.DB.WithContext(ctx).First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func List(ctx context.Context, query ListQuery) ([]DbProject, int64, error) {
	var items []DbProject
	var total int64
	db := global.DB.WithContext(ctx).Model(&DbProject{})

	keyword := strings.TrimSpace(query.Keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ?", like)
	}
	if query.DatasourceID > 0 {
		db = db.Where("datasource_id = ?", query.DatasourceID)
	}
	if query.ProjectOwnerID > 0 {
		db = db.Where("id IN (SELECT project_id FROM project_members WHERE user_id = ? AND role = ?)", query.ProjectOwnerID, MemberRoleProjectOwner)
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

func DeleteByID(ctx context.Context, id uint) error {
	return global.DB.WithContext(ctx).Delete(&DbProject{}, id).Error
}

// Member queries

func ListMembers(ctx context.Context, projectID uint) ([]ProjectMember, error) {
	var members []ProjectMember
	if err := global.DB.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("id asc").
		Find(&members).Error; err != nil {
		return nil, err
	}
	return members, nil
}

func ReplaceMembers(ctx context.Context, projectID uint, members []ProjectMember) error {
	return global.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("project_id = ?", projectID).Delete(&ProjectMember{}).Error; err != nil {
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

func GetMemberRole(ctx context.Context, projectID, userID uint) (string, error) {
	var m ProjectMember
	if err := global.DB.WithContext(ctx).
		Where("project_id = ? AND user_id = ?", projectID, userID).
		First(&m).Error; err != nil {
		return "", err
	}
	return m.Role, nil
}
