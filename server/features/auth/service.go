package auth

import (
	"context"
	"errors"
	"strings"

	"czwlinux.cloud/go-friday-starter/features/user"
	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/password"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("无效的用户名或密码")
	ErrUserDisabled       = errors.New("用户已被禁用")
)

func Login(ctx context.Context, req LoginRequest) (*AuthResult, error) {
	username := strings.TrimSpace(req.Username)
	rawPassword := strings.TrimSpace(req.Password)
	if username == "" || rawPassword == "" {
		return nil, ErrInvalidCredentials
	}

	u, err := user.FindByUsername(ctx, username)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if u.Status != user.StatusActive {
		return nil, ErrUserDisabled
	}
	if !password.Check(rawPassword, u.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	token, err := global.JWT.Generate(u.ID)
	if err != nil {
		return nil, err
	}
	return &AuthResult{Token: token, User: user.ToDTO(u)}, nil
}
