package rolepermission

import (
	"errors"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) ListRolePermissions(c echo.Context) error {
	roleID := c.Param("roleId")
	if roleID == "" {
		return response.BadRequest(c, "invalid role id")
	}
	items, err := GetRolePermissions(c.Request().Context(), roleID)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid role id")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, items)
}

func (h *Handler) Assign(c echo.Context) error {
	roleID := c.Param("roleId")
	if roleID == "" {
		return response.BadRequest(c, "invalid role id")
	}
	var req AssignRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := AssignPermission(c.Request().Context(), roleID, req)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if errors.Is(err, ErrAlreadyExists) {
		return response.Error(c, 409, "permission already assigned to role")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Unassign(c echo.Context) error {
	roleID := c.Param("roleId")
	if roleID == "" {
		return response.BadRequest(c, "invalid role id")
	}
	permID := c.Param("permId")
	if permID == "" {
		return response.BadRequest(c, "invalid permission id")
	}
	if err := UnassignPermission(c.Request().Context(), roleID, permID); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "role permission not found")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}
