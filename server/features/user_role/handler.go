package userrole

import (
	"errors"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) ListUserRoles(c echo.Context) error {
	userID := c.Param("userId")
	if userID == "" {
		return response.BadRequest(c, "invalid user id")
	}
	items, err := GetUserRoles(c.Request().Context(), userID)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid user id")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, items)
}

func (h *Handler) Assign(c echo.Context) error {
	userID := c.Param("userId")
	if userID == "" {
		return response.BadRequest(c, "invalid user id")
	}
	var req AssignRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	req.UserID = userID
	item, err := AssignRole(c.Request().Context(), req)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if errors.Is(err, ErrAlreadyExists) {
		return response.Error(c, 409, "user already has this role")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Unassign(c echo.Context) error {
	userID := c.Param("userId")
	if userID == "" {
		return response.BadRequest(c, "invalid user id")
	}
	roleID := c.Param("roleId")
	if roleID == "" {
		return response.BadRequest(c, "invalid role id")
	}
	if err := UnassignRole(c.Request().Context(), userID, roleID); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "user role not found")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}
