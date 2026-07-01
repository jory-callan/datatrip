package stats

import (
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Dashboard(c echo.Context) error {
	stats, err := GetDashboardStats(c.Request().Context())
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, stats)
}
