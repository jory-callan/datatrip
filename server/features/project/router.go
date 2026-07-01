package project

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
	g.PUT("/:id/members", h.UpdateMembers)
	g.GET("/:id/members", h.ListMembers)
}
