package webhook

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

	items, total, err := ListWebhooksService(c.Request().Context(), q)
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
	item, err := CreateWebhookService(c.Request().Context(), req)
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
	item, err := UpdateWebhookService(c.Request().Context(), uint(id), req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "webhook not found")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, item)
}

func (h *Handler) ListDeliveryLogs(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	page := 1
	pageSize := 20
	if p := c.QueryParam("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}
	if ps := c.QueryParam("page_size"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil && v > 0 && v <= 100 {
			pageSize = v
		}
	}
	items, total, err := ListDeliveryLogs(c.Request().Context(), uint(id), page, pageSize)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, page, pageSize)
}
