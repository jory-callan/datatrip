package user

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("", h.List)
	g.POST("", h.Create)
	g.DELETE("/batch", h.BatchDelete)
	g.GET("/me", h.Me)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}
