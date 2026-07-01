package auth

import (
	"czwlinux.cloud/go-friday-starter/pkg/authctx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	g.POST("/login", h.Login)
	g.PUT("/profile", h.UpdateProfile, authctx.RequireAuth())
}

// RequireRole 返回 Echo 中间件，校验当前用户是否拥有指定角色码之一
func RequireRole(allowedCodes ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userID, ok := authctx.CurrentUserID(c)
			if !ok {
				return response.Unauthorized(c, "unauthorized")
			}
			if !CheckPermissionByID(c.Request().Context(), userID, allowedCodes...) {
				return response.Forbidden(c, "forbidden")
			}
			return next(c)
		}
	}
}
