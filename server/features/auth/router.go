package auth

import (
	"czwlinux.cloud/go-friday-starter/pkg/authctx"
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.POST("/login", h.Login)
	g.PUT("/profile", h.UpdateProfile, authctx.RequireAuth())
}
