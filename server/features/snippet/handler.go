package snippet

import (
	"errors"

	"czwlinux.cloud/go-friday-starter/pkg/httpx"
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

	userID := httpx.CurrentUserID(c)
	if q.UserID == "" {
		q.UserID = userID
	}

	items, total, err := ListSnippets(c.Request().Context(), q)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, q.Page, q.PageSize)
}

func (h *Handler) ListMy(c echo.Context) error {
	userID := httpx.CurrentUserID(c)
	items, err := ListMySnippets(c.Request().Context(), userID)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, items)
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	userID := httpx.CurrentUserID(c)
	item, err := CreateSnippet(c.Request().Context(), userID, req)
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
	userID := httpx.CurrentUserID(c)
	item, err := UpdateSnippet(c.Request().Context(), id, userID, req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "snippet not found")
	}
	if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden")
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
	userID := httpx.CurrentUserID(c)
	if err := DeleteSnippet(c.Request().Context(), id, userID); errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "snippet not found")
	} else if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}
