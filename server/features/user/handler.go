package user

import (
	"errors"
	"net/http"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/authctx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) List(c echo.Context) error {
	pq, filters, err := response.ParseListQuery(c)
	if err != nil {
		return response.BadRequest(c, "invalid param")
	}

	items, total, err := ListUsers(c.Request().Context(), pq, filters)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, pq.Page, pq.PageSize)
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := CreateUser(c.Request().Context(), req)
	if err != nil {
		// Validation errors: pass through the message
		if errors.Is(err, ErrInvalidInput) || strings.HasPrefix(err.Error(), "username") || strings.HasPrefix(err.Error(), "password") {
			return response.BadRequest(c, err.Error())
		}
		if errors.Is(err, ErrUsernameExists) {
			return response.Error(c, http.StatusConflict, "username already exists")
		}
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Get(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := GetUser(c.Request().Context(), id)
	if errors.Is(err, ErrUserNotFound) {
		return response.NotFound(c, "user not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Update(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid param")
	}
	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := UpdateUser(c.Request().Context(), id, req)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if errors.Is(err, ErrUserNotFound) {
		return response.NotFound(c, "user not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid param")
	}
	if err := DeleteUser(c.Request().Context(), id); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if errors.Is(err, ErrUserNotFound) {
		return response.NotFound(c, "user not found")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) BatchDelete(c echo.Context) error {
	var req BatchDeleteRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	if err := BatchDeleteUsers(c.Request().Context(), req.IDs); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) Me(c echo.Context) error {
	userID, ok := authctx.CurrentUserID(c)
	if !ok {
		return response.Unauthorized(c, "unauthorized")
	}
	profile, err := GetProfile(c.Request().Context(), userID)
	if errors.Is(err, ErrUserNotFound) {
		return response.NotFound(c, "user not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, profile)
}

func (h *Handler) UpdateProfile(c echo.Context) error {
	userID, ok := authctx.CurrentUserID(c)
	if !ok {
		return response.Unauthorized(c, "unauthorized")
	}
	var req UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid request")
	}
	profile, err := UpdateProfile(c.Request().Context(), userID, req)
	if errors.Is(err, ErrInvalidInput) || (err != nil && strings.HasPrefix(err.Error(), "password")) {
		return response.BadRequest(c, err.Error())
	}
	if errors.Is(err, ErrUserNotFound) {
		return response.NotFound(c, "user not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, profile)
}

func parseID(c echo.Context) (string, error) {
	id := c.Param("id")
	if id == "" {
		return "", ErrInvalidInput
	}
	return id, nil
}
