package poolstats

import (
	"czwlinux.cloud/go-friday-starter/pkg/dbpool"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Get(c echo.Context) error {
	id := c.Param("id")
	if id != "" {
		stats := dbpool.GetPoolStats(id)
		return response.Ok(c, stats)
	}
	stats := dbpool.ListAllPoolStats()
	return response.Ok(c, stats)
}
