package project

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("project not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListProjects(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
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

func GetProject(ctx context.Context, id string) (*DTO, error) {
	if id == "" {
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
	if name == "" || req.DatasourceID == "" {
		return nil, ErrInvalidInput
	}
	approvalMode := req.ApprovalMode
	if approvalMode == "" {
		approvalMode = ApprovalModeAnyOne
	}
	if approvalMode != ApprovalModeAnyOne && approvalMode != ApprovalModeAll {
		return nil, ErrInvalidInput
	}

	p := &DataProject{
		Name:         name,
		DatasourceID: req.DatasourceID,
		Scope:        joinStrings(req.Scope),
		ApprovalMode: approvalMode,
		WebhookIDs:   joinIDs(req.WebhookIDs),
	}
	if err := Create(ctx, p); err != nil {
		return nil, err
	}
	return GetProject(ctx, p.ID)
}

func UpdateProject(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
	if id == "" {
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
	if req.Scope != nil {
		p.Scope = joinStrings(req.Scope)
	}
	if req.ApprovalMode != "" {
		p.ApprovalMode = req.ApprovalMode
	}
	if req.WebhookIDs != nil {
		p.WebhookIDs = joinIDs(req.WebhookIDs)
	}

	if err := Save(ctx, p); err != nil {
		return nil, err
	}
	return GetProject(ctx, p.ID)
}

func DeleteProject(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	err := DeleteByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

func BatchDeleteProjects(ctx context.Context, ids []string) error {
	cleanIDs := make([]string, 0, len(ids))
	for _, id := range ids {
		if strings.TrimSpace(id) != "" {
			cleanIDs = append(cleanIDs, strings.TrimSpace(id))
		}
	}
	if len(cleanIDs) == 0 {
		return ErrInvalidInput
	}
	return DeleteByIDs(ctx, cleanIDs)
}

func GetProjectMembers(ctx context.Context, projectID string) ([]*MemberDTO, error) {
	if projectID == "" {
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

func UpdateProjectMembers(ctx context.Context, projectID string, req UpdateMembersRequest) ([]*MemberDTO, error) {
	if projectID == "" {
		return nil, ErrInvalidInput
	}
	_, err := GetByID(ctx, projectID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	members := make([]DataProjectMember, 0, len(req.Members))
	for _, m := range req.Members {
		if m.UserID == "" || m.Role == "" {
			continue
		}
		members = append(members, DataProjectMember{
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

func GetUserProjectRole(ctx context.Context, projectID, userID string) string {
	role, err := GetMemberRole(ctx, projectID, userID)
	if err != nil {
		return ""
	}
	return role
}

// HasProjectAccess 检查用户是否有项目访问权限。
// 用户是项目成员（有任意 role）则通过。
// 用户有 * 权限码则直接放行（超级管理员 bypass）。
func HasProjectAccess(ctx context.Context, userID, projectID string, permissionCodes []string) bool {
	// Super admin bypass
	for _, code := range permissionCodes {
		if code == "*" {
			return true
		}
	}
	// Normal member check
	role, err := GetMemberRole(ctx, projectID, userID)
	if err != nil {
		return false
	}
	return role != ""
}

// GetProjectAdminIDs returns the user IDs of all admin members for a project.
func GetProjectAdminIDs(ctx context.Context, projectID string) ([]string, error) {
	members, err := ListMembers(ctx, projectID)
	if err != nil {
		return nil, err
	}
	var ids []string
	for _, m := range members {
		if m.Role == MemberRoleAdmin {
			ids = append(ids, m.UserID)
		}
	}
	return ids, nil
}

// GetProjectApproverIDs returns the user IDs of all approver and admin members for a project.
// Both approvers and admins can approve tickets and escalations.
func GetProjectApproverIDs(ctx context.Context, projectID string) ([]string, error) {
	members, err := ListMembers(ctx, projectID)
	if err != nil {
		return nil, err
	}
	var ids []string
	seen := make(map[string]bool)
	for _, m := range members {
		if (m.Role == MemberRoleApprover || m.Role == MemberRoleAdmin) && !seen[m.UserID] {
			ids = append(ids, m.UserID)
			seen[m.UserID] = true
		}
	}
	return ids, nil
}
