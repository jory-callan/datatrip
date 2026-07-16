package audit

import (
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

	items, total, err := ListAuditLogs(c.Request().Context(), pq, filters)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, pq.Page, pq.PageSize)
}
