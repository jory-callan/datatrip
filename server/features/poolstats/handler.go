package poolstats

import (
	"strconv"

	"czwlinux.cloud/go-friday-starter/pkg/dbpool"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Get(c echo.Context) error {
	idStr := c.Param("id")
	if idStr != "" {
		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil || id == 0 {
			return response.BadRequest(c, "invalid id")
		}
		stats := dbpool.GetPoolStats(uint(id))
		return response.Ok(c, stats)
	}
	// List all
	stats := dbpool.ListAllPoolStats()
	return response.Ok(c, stats)
}
