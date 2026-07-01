package stats

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("/dashboard/stats", h.Dashboard)
}
