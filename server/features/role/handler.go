package role

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
	items, err := ListRoles(c.Request().Context())
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, items)
}

func (h *Handler) Get(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	item, err := GetRole(c.Request().Context(), id)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "role not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid id")
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
	item, err := CreateRole(c.Request().Context(), req)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if errors.Is(err, ErrCodeExists) {
		return response.Error(c, 409, "role code already exists")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Update(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := UpdateRole(c.Request().Context(), id, req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "role not found")
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
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	if err := DeleteRole(c.Request().Context(), id); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid id")
	} else if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "role not found")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}
