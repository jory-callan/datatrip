package poolstats

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("/pool-stats", h.Get)
	g.GET("/pool-stats/:id", h.Get)
}
