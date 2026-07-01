package ticket

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.POST("", h.Create)
	g.GET("", h.List)
	g.GET("/:id", h.Detail)
	g.POST("/:id/approve", h.Approve)
	g.POST("/:id/reject", h.Reject)
	g.POST("/:id/urge", h.Urge)
	g.POST("/:id/resubmit", h.Resubmit)
}
