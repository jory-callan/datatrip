package auth

import (
	"errors"

	"czwlinux.cloud/go-friday-starter/features/user"
	"czwlinux.cloud/go-friday-starter/pkg/authctx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid request")
	}

	result, err := Login(c.Request().Context(), req)
	if errors.Is(err, ErrInvalidCredentials) {
		return response.Error(c, 401, "用户名或密码错误")
	}
	if errors.Is(err, ErrUserDisabled) {
		return response.Forbidden(c, "用户已被禁用")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, result)
}

// UpdateProfile handles updating the current user's profile (nickname, password).
func (h *Handler) UpdateProfile(c echo.Context) error {
	userID, ok := authctx.CurrentUserID(c)
	if !ok {
		return response.Unauthorized(c, "unauthorized")
	}

	var req user.UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid request")
	}

	profile, err := user.UpdateProfile(c.Request().Context(), userID, req)
	if errors.Is(err, user.ErrInvalidInput) {
		return response.BadRequest(c, err.Error())
	}
	if errors.Is(err, user.ErrUserNotFound) {
		return response.NotFound(c, "user not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, profile)
}
