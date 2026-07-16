package user

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/exportx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/password"

	"gorm.io/gorm"
)

var (
	ErrUserNotFound   = errors.New("user not found")
	ErrInvalidInput   = errors.New("invalid input")
	ErrUsernameExists = errors.New("username already exists")
)

func GetProfile(ctx context.Context, userID string) (*DTO, error) {
	u, err := GetByID(ctx, userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(u), nil
}

func ListUsers(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
	users, total, err := List(ctx, pq, filters)
	if err != nil {
		return nil, 0, err
	}
	items := make([]*DTO, 0, len(users))
	for i := range users {
		items = append(items, ToDTO(&users[i]))
	}
	return items, total, nil
}

func GetUser(ctx context.Context, id string) (*DTO, error) {
	if id == "" {
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
		Email:        strings.TrimSpace(req.Email),
		Phone:        strings.TrimSpace(req.Phone),
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

func UpdateUser(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
	if id == "" {
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
	status := strings.TrimSpace(req.Status)

	if nickname != "" {
		u.Nickname = nickname
	}
	if req.Email != "" {
		u.Email = req.Email
	}
	if req.Phone != "" {
		u.Phone = req.Phone
	}
	if status != "" {
		if status != StatusActive && status != StatusDisabled {
			return nil, ErrInvalidInput
		}
		u.Status = status
	}

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

func DeleteUser(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	if err := DeleteByID(ctx, id); errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrUserNotFound
	} else if err != nil {
		return err
	}
	return nil
}

// UpdateProfile updates the current user's own profile (nickname, email, phone, password).
func UpdateProfile(ctx context.Context, userID string, req UpdateProfileRequest) (*DTO, error) {
	if userID == "" {
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
	if req.Email != "" {
		u.Email = req.Email
	}
	if req.Phone != "" {
		u.Phone = req.Phone
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

func BatchDeleteUsers(ctx context.Context, ids []string) error {
	cleanIDs := CleanIDs(ids)
	if len(cleanIDs) == 0 {
		return ErrInvalidInput
	}
	return DeleteByIDs(ctx, cleanIDs)
}

func BatchExportUsers(ctx context.Context, ids []string) (*exportx.Result, error) {
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

func CleanIDs(ids []string) []string {
	cleanIDs := make([]string, 0, len(ids))
	seen := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		if id == "" {
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
		{Header: "ID", Value: func(u User) string { return u.ID }},
		{Header: "Username", Value: func(u User) string { return u.Username }},
		{Header: "Nickname", Value: func(u User) string { return u.Nickname }},
		{Header: "Email", Value: func(u User) string { return u.Email }},
		{Header: "Phone", Value: func(u User) string { return u.Phone }},
		{Header: "Status", Value: func(u User) string { return u.Status }},
		{Header: "Created At", Value: func(u User) string { return exportx.Time(u.CreatedAt) }},
		{Header: "Updated At", Value: func(u User) string { return exportx.Time(u.UpdatedAt) }},
	}
}
