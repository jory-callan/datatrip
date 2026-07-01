package webhook

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("", h.List)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
	g.GET("/:id/delivery-logs", h.ListDeliveryLogs)
}
