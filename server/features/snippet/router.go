package snippet

import (
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.GET("/snippets", h.List)
	g.GET("/snippets/my", h.ListMy)
	g.POST("/snippets", h.Create)
	g.PUT("/snippets/:id", h.Update)
	g.DELETE("/snippets/:id", h.Delete)
}
