package project

import (
	"errors"
	"strconv"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) List(c echo.Context) error {
	var q ListQuery
	q.NeedCount = true
	if err := c.Bind(&q); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	if c.QueryParam("need_count") == "false" {
		q.NeedCount = false
	}
	q.Normalize()

	items, total, err := ListProjects(c.Request().Context(), q)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, q.Page, q.PageSize)
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := CreateProject(c.Request().Context(), req)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Get(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	item, err := GetProject(c.Request().Context(), uint(id))
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Update(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := UpdateProject(c.Request().Context(), uint(id), req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	if err := DeleteProject(c.Request().Context(), uint(id)); errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) ListMembers(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	members, err := GetProjectMembers(c.Request().Context(), uint(id))
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, members)
}

func (h *Handler) UpdateMembers(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	var req UpdateMembersRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	members, err := UpdateProjectMembers(c.Request().Context(), uint(id), req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, members)
}
