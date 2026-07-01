package project

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("project not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListProjects(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
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

func GetProject(ctx context.Context, id uint) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	p, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(p), nil
}

func CreateProject(ctx context.Context, req CreateRequest) (*DTO, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" || req.DatasourceID == 0 {
		return nil, ErrInvalidInput
	}
	approvalMode := req.ApprovalMode
	if approvalMode == "" {
		approvalMode = ApprovalModeAnyOne
	}
	if approvalMode != ApprovalModeAnyOne && approvalMode != ApprovalModeAll {
		return nil, ErrInvalidInput
	}

	p := &DbProject{
		Name:         name,
		DatasourceID: req.DatasourceID,
		Databases:    joinStrings(req.Databases),
		ApprovalMode: approvalMode,
		ApproverIDs:  joinIDs(req.ApproverIDs),
		AutoMatchApprover: req.AutoMatchApprover,
		WebhookIDs:   joinIDs(req.WebhookIDs),
	}
	if err := Create(ctx, p); err != nil {
		return nil, err
	}
	return GetProject(ctx, p.ID)
}

func UpdateProject(ctx context.Context, id uint, req UpdateRequest) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	p, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		p.Name = req.Name
	}
	if req.Databases != nil {
		p.Databases = joinStrings(req.Databases)
	}
	if req.ApprovalMode != "" {
		p.ApprovalMode = req.ApprovalMode
	}
	if req.ApproverIDs != nil {
		p.ApproverIDs = joinIDs(req.ApproverIDs)
	}
	p.AutoMatchApprover = req.AutoMatchApprover
	if req.WebhookIDs != nil {
		p.WebhookIDs = joinIDs(req.WebhookIDs)
	}

	if err := Save(ctx, p); err != nil {
		return nil, err
	}
	return GetProject(ctx, p.ID)
}

func DeleteProject(ctx context.Context, id uint) error {
	if id == 0 {
		return ErrInvalidInput
	}
	err := DeleteByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

func GetProjectMembers(ctx context.Context, projectID uint) ([]*MemberDTO, error) {
	if projectID == 0 {
		return nil, ErrInvalidInput
	}
	_, err := GetByID(ctx, projectID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	dbMembers, err := ListMembers(ctx, projectID)
	if err != nil {
		return nil, err
	}
	result := make([]*MemberDTO, 0, len(dbMembers))
	for i := range dbMembers {
		result = append(result, ToMemberDTO(&dbMembers[i]))
	}
	return result, nil
}

func UpdateProjectMembers(ctx context.Context, projectID uint, req UpdateMembersRequest) ([]*MemberDTO, error) {
	if projectID == 0 {
		return nil, ErrInvalidInput
	}
	_, err := GetByID(ctx, projectID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	members := make([]ProjectMember, 0, len(req.Members))
	for _, m := range req.Members {
		if m.UserID == 0 || m.Role == "" {
			continue
		}
		members = append(members, ProjectMember{
			ProjectID: projectID,
			UserID:    m.UserID,
			Role:      m.Role,
		})
	}
	if err := ReplaceMembers(ctx, projectID, members); err != nil {
		return nil, err
	}

	dbMembers, err := ListMembers(ctx, projectID)
	if err != nil {
		return nil, err
	}
	result := make([]*MemberDTO, 0, len(dbMembers))
	for i := range dbMembers {
		result = append(result, ToMemberDTO(&dbMembers[i]))
	}
	return result, nil
}

func GetUserProjectRole(ctx context.Context, projectID, userID uint) string {
	role, err := GetMemberRole(ctx, projectID, userID)
	if err != nil {
		return ""
	}
	return role
}

// CheckProjectPermission 检查用户是否有项目访问权限
func CheckProjectPermission(ctx context.Context, userID, projectID uint) bool {
	role, err := GetMemberRole(ctx, projectID, userID)
	if err != nil {
		global.Log.Warn("project permission check failed", zap.Uint("user_id", userID), zap.Uint("project_id", projectID))
		return false
	}
	return role != ""
}

// GetProjectOwnerIDs returns the user IDs of all project_owner members for a project.
func GetProjectOwnerIDs(ctx context.Context, projectID uint) ([]uint, error) {
	members, err := ListMembers(ctx, projectID)
	if err != nil {
		return nil, err
	}
	var ids []uint
	for _, m := range members {
		if m.Role == MemberRoleProjectOwner {
			ids = append(ids, m.UserID)
		}
	}
	return ids, nil
}
