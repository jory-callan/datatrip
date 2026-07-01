package sqlfavorite

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("/sql-favorites", h.List)
	g.GET("/sql-favorites/my", h.ListMy)
	g.POST("/sql-favorites", h.Create)
	g.PUT("/sql-favorites/:id", h.Update)
	g.DELETE("/sql-favorites/:id", h.Delete)
}
