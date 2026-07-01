package sqlfavorite

import (
	"errors"
	"strconv"

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

	// If scope is 'my', scope by current user
	if q.Scope == "" || q.Scope == "my" {
		q.UserID = userID
	}

	items, total, err := ListFavorites(c.Request().Context(), q)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, q.Page, q.PageSize)
}

func (h *Handler) ListMy(c echo.Context) error {
	userID := httpx.CurrentUserID(c)
	items, err := ListMyFavorites(c.Request().Context(), userID)
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
	item, err := CreateFavorite(c.Request().Context(), userID, req)
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
	userID := httpx.CurrentUserID(c)
	item, err := UpdateFavorite(c.Request().Context(), uint(id), userID, req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "favorite not found")
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	userID := httpx.CurrentUserID(c)
	if err := DeleteFavorite(c.Request().Context(), uint(id), userID); errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "favorite not found")
	} else if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}
