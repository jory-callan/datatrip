package permission

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/features/auth"
	"czwlinux.cloud/go-friday-starter/features/role"
	rolepermission "czwlinux.cloud/go-friday-starter/features/role_permission"
	"czwlinux.cloud/go-friday-starter/features/user"
	userrole "czwlinux.cloud/go-friday-starter/features/user_role"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("permission not found")
	ErrInvalidInput = errors.New("invalid input")
	ErrCodeExists   = errors.New("permission code already exists")
)

func ListPermissions(ctx context.Context, query ListQuery) ([]*DTO, error) {
	list, err := List(ctx, query.Module)
	if err != nil {
		return nil, err
	}
	items := make([]*DTO, 0, len(list))
	for i := range list {
		items = append(items, ToDTO(&list[i]))
	}
	return items, nil
}

func GetPermission(ctx context.Context, id string) (*DTO, error) {
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

func CreatePermission(ctx context.Context, req CreateRequest) (*DTO, error) {
	code := strings.TrimSpace(req.Code)
	name := strings.TrimSpace(req.Name)
	module := strings.TrimSpace(req.Module)

	if code == "" || name == "" {
		return nil, ErrInvalidInput
	}

	exists, err := ExistsByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrCodeExists
	}

	p := &Permission{
		Code:        code,
		Name:        name,
		Description: strings.TrimSpace(req.Description),
		Module:      module,
	}

	if err := Create(ctx, p); err != nil {
		return nil, err
	}
	p, err = GetByID(ctx, p.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(p), nil
}

func UpdatePermission(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
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
	if req.Description != "" {
		p.Description = req.Description
	}
	if req.Module != "" {
		p.Module = req.Module
	}

	if err := Save(ctx, p); err != nil {
		return nil, err
	}
	p, err = GetByID(ctx, p.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(p), nil
}

func DeletePermission(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	if err := DeleteByID(ctx, id); errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return nil
}

// ---------------------------------------------------------------------------
// Bindings — which roles and users are associated with this permission
// ---------------------------------------------------------------------------

type BindingRole struct {
	ID   string `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

type BindingUser struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Nickname string `json:"nickname"`
}

type GetBindingsResponse struct {
	Permission *DTO          `json:"permission"`
	Roles      []BindingRole `json:"roles"`
	Users      []BindingUser `json:"users"`
}

func GetPermissionBindings(ctx context.Context, permissionID string) (*GetBindingsResponse, error) {
	if permissionID == "" {
		return nil, ErrInvalidInput
	}

	// 1. Get the permission itself
	p, err := GetByID(ctx, permissionID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	// 2. Collect role IDs: direct binding + wildcard matching
	rpSet := make(map[string]bool) // roleID -> true

	// 2a. Direct role_permission records for this permission
	rpList, err := rolepermission.ListByPermission(ctx, permissionID)
	if err != nil {
		return nil, err
	}
	for _, rp := range rpList {
		rpSet[rp.RoleID] = true
	}

	// 2b. Wildcard matching — roles with permissions whose code contains "*"
	//     e.g. "*" matches everything, "db:*" matches all db permissions
	allPerms, err := List(ctx, "")
	if err == nil {
		for i := range allPerms {
			perm := &allPerms[i]
			if !strings.Contains(perm.Code, "*") {
				continue
			}
			if perm.ID == permissionID {
				continue // already handled in 2a
			}
			if auth.HasPermission([]string{perm.Code}, p.Code) {
				wildcardRpList, err := rolepermission.ListByPermission(ctx, perm.ID)
				if err != nil {
					continue
				}
				for _, rp := range wildcardRpList {
					rpSet[rp.RoleID] = true
				}
			}
		}
	}

	// 3. Resolve roles
	seenUser := make(map[string]bool)
	roles := make([]BindingRole, 0, len(rpSet))
	userIDs := make([]string, 0)

	for roleID := range rpSet {
		r, err := role.GetByID(ctx, roleID)
		if err != nil {
			continue // skip roles that disappeared
		}
		roles = append(roles, BindingRole{
			ID:   r.ID,
			Code: r.Code,
			Name: r.Name,
		})

		// 4. For each role, get users
		urList, err := userrole.ListByRole(ctx, roleID)
		if err != nil {
			continue
		}
		for _, ur := range urList {
			if seenUser[ur.UserID] {
				continue
			}
			seenUser[ur.UserID] = true
			userIDs = append(userIDs, ur.UserID)
		}
	}

	// 5. Resolve user details
	users := make([]BindingUser, 0, len(userIDs))
	for _, uid := range userIDs {
		u, err := user.GetByID(ctx, uid)
		if err != nil {
			continue
		}
		users = append(users, BindingUser{
			ID:       u.ID,
			Username: u.Username,
			Nickname: u.Nickname,
		})
	}

	return &GetBindingsResponse{
		Permission: ToDTO(p),
		Roles:      roles,
		Users:      users,
	}, nil
}
