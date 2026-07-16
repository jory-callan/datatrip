package permission

import (
	"errors"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) List(c echo.Context) error {
	var q ListQuery
	if err := c.Bind(&q); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	items, err := ListPermissions(c.Request().Context(), q)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, items)
}

func (h *Handler) Get(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid id")
	}
	item, err := GetPermission(c.Request().Context(), id)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "permission not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := CreatePermission(c.Request().Context(), req)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if errors.Is(err, ErrCodeExists) {
		return response.Error(c, 409, "permission code already exists")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Update(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid id")
	}
	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := UpdatePermission(c.Request().Context(), id, req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "permission not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid id")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid id")
	}
	if err := DeletePermission(c.Request().Context(), id); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid id")
	} else if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "permission not found")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) GetBindings(c echo.Context) error {
	id, err := parseID(c)
	if err != nil {
		return response.BadRequest(c, "invalid id")
	}
	result, err := GetPermissionBindings(c.Request().Context(), id)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "permission not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid id")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, result)
}

func parseID(c echo.Context) (string, error) {
	id := c.Param("id")
	if id == "" {
		return "", ErrInvalidInput
	}
	return id, nil
}
