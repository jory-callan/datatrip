package user

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/exportx"
	"czwlinux.cloud/go-friday-starter/pkg/password"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrInvalidInput   = errors.New("invalid input")
	ErrUsernameExists = errors.New("username already exists")
)

func GetProfile(ctx context.Context, userID uint) (*DTO, error) {
	u, err := GetByID(ctx, userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(u), nil
}

func ListUsers(ctx context.Context, query ListQuery) ([]*DTO, int64, error) {
	query.Normalize()
	users, total, err := List(ctx, query)
	if err != nil {
		return nil, 0, err
	}
	items := make([]*DTO, 0, len(users))
	for i := range users {
		items = append(items, ToDTO(&users[i]))
	}
	return items, total, nil
}

func GetUser(ctx context.Context, id uint) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	u, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(u), nil
}

func CreateUser(ctx context.Context, req CreateRequest) (*DTO, error) {
	username := strings.TrimSpace(req.Username)
	rawPassword := strings.TrimSpace(req.Password)
	nickname := strings.TrimSpace(req.Nickname)
	roleCode := strings.TrimSpace(req.RoleCode)
	status := strings.TrimSpace(req.Status)

	if username == "" || rawPassword == "" {
		return nil, fmt.Errorf("username and password are required")
	}
	if len(username) > 64 {
		return nil, fmt.Errorf("username must be at most 64 characters")
	}
	if len(rawPassword) < 6 {
		return nil, fmt.Errorf("password must be at least 6 characters")
	}
	if nickname == "" {
		nickname = username
	}
	if status == "" {
		status = StatusActive
	}
	if status != StatusActive && status != StatusDisabled {
		return nil, ErrInvalidInput
	}
	if roleCode == "" {
		roleCode = RoleViewer
	}

	exists, err := ExistsByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUsernameExists
	}

	hash, err := password.Hash(rawPassword)
	if err != nil {
		return nil, err
	}

	u := &User{
		Username:     username,
		PasswordHash: hash,
		Nickname:     nickname,
		RoleCode:     roleCode,
		Status:       status,
	}

	if err := Create(ctx, u); err != nil {
		return nil, err
	}
	u, err = GetByID(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(u), nil
}

func UpdateUser(ctx context.Context, id uint, req UpdateRequest) (*DTO, error) {
	if id == 0 {
		return nil, ErrInvalidInput
	}
	u, err := GetByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	nickname := strings.TrimSpace(req.Nickname)
	roleCode := strings.TrimSpace(req.RoleCode)
	status := strings.TrimSpace(req.Status)

	if nickname == "" {
		nickname = u.Nickname
	}
	if roleCode != "" {
		u.RoleCode = roleCode
	}
	if status != "" {
		if status != StatusActive && status != StatusDisabled {
			return nil, ErrInvalidInput
		}
		u.Status = status
	}
	u.Nickname = nickname

	if req.Password != "" {
		if len(req.Password) < 6 {
			return nil, ErrInvalidInput
		}
		hash, err := password.Hash(req.Password)
		if err != nil {
			return nil, err
		}
		u.PasswordHash = hash
	}

	if err := Save(ctx, u); err != nil {
		return nil, err
	}
	u, err = GetByID(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(u), nil
}

func DeleteUser(ctx context.Context, id uint) error {
	if id == 0 {
		return ErrInvalidInput
	}
	if err := DeleteByID(ctx, id); errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrUserNotFound
	} else if err != nil {
		return err
	}
	return nil
}

// UpdateProfile updates the current user's own profile (nickname, password).
func UpdateProfile(ctx context.Context, userID uint, req UpdateProfileRequest) (*DTO, error) {
	if userID == 0 {
		return nil, ErrInvalidInput
	}
	u, err := GetByID(ctx, userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	if req.Nickname != "" {
		u.Nickname = req.Nickname
	}
	if req.Password != "" {
		if len(req.Password) < 6 {
			return nil, fmt.Errorf("password must be at least 6 characters")
		}
		hash, err := password.Hash(req.Password)
		if err != nil {
			return nil, err
		}
		u.PasswordHash = hash
	}

	if err := Save(ctx, u); err != nil {
		return nil, err
	}
	u, err = GetByID(ctx, u.ID)
	if err != nil {
		return nil, err
	}
	return ToDTO(u), nil
}

func BatchDeleteUsers(ctx context.Context, ids []uint) error {
	cleanIDs := CleanIDs(ids)
	if len(cleanIDs) == 0 {
		return ErrInvalidInput
	}
	return DeleteByIDs(ctx, cleanIDs)
}

func BatchExportUsers(ctx context.Context, ids []uint) (*exportx.Result, error) {
	cleanIDs := CleanIDs(ids)
	if len(cleanIDs) == 0 {
		return nil, ErrInvalidInput
	}
	users, err := ListByIDs(ctx, cleanIDs)
	if err != nil {
		return nil, err
	}
	return exportx.CSV("users.csv", UserExportColumns(), users)
}

func CleanIDs(ids []uint) []uint {
	cleanIDs := make([]uint, 0, len(ids))
	seen := make(map[uint]struct{}, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		cleanIDs = append(cleanIDs, id)
	}
	return cleanIDs
}

func UserExportColumns() []exportx.Column[User] {
	return []exportx.Column[User]{
		{Header: "ID", Value: func(u User) string { return exportx.Uint(u.ID) }},
		{Header: "Username", Value: func(u User) string { return u.Username }},
		{Header: "Nickname", Value: func(u User) string { return u.Nickname }},
		{Header: "Role", Value: func(u User) string { return u.RoleCode }},
		{Header: "Status", Value: func(u User) string { return u.Status }},
		{Header: "Created At", Value: func(u User) string { return exportx.Time(u.CreatedAt) }},
		{Header: "Updated At", Value: func(u User) string { return exportx.Time(u.UpdatedAt) }},
	}
}
