package escalation

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.POST("", h.Create)
	g.GET("", h.List)
	g.GET("/active", h.CheckActive)
	g.PUT("/:id", h.Update)
	g.DELETE("/batch", h.BatchDelete)
	g.DELETE("/:id", h.Delete)
	g.POST("/:id/approve", h.Approve)
	g.POST("/:id/reject", h.Reject)
}
