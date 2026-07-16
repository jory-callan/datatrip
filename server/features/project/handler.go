package project

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
	pq, filters, err := response.ParseListQuery(c)
	if err != nil {
		return response.BadRequest(c, "invalid param")
	}

	items, total, err := ListProjects(c.Request().Context(), pq, filters)
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
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	item, err := GetProject(c.Request().Context(), id)
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
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	item, err := UpdateProject(c.Request().Context(), id, req)
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
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	if err := DeleteProject(c.Request().Context(), id); errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
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
	if err := BatchDeleteProjects(c.Request().Context(), req.IDs); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) ListMembers(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	members, err := GetProjectMembers(c.Request().Context(), id)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "project not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, members)
}

func (h *Handler) UpdateMembers(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}
	var req UpdateMembersRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	members, err := UpdateProjectMembers(c.Request().Context(), id, req)
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
