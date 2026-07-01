package httpx

import (
	"czwlinux.cloud/go-friday-starter/pkg/authctx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"czwlinux.cloud/go-friday-starter/pkg/jwt"
	"github.com/labstack/echo/v4"
)

const CurrentUserIDKey = authctx.CurrentUserIDKey

// JWTAuth 校验 Authorization: Bearer <token>，并把 user_id 写入 Echo context。
func JWTAuth(manager *jwt.Manager) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if manager == nil {
				return response.Unauthorized(c, "unauthorized")
			}

			token, err := jwt.FromBearer(c.Request().Header.Get(echo.HeaderAuthorization))
			if err != nil {
				return response.Unauthorized(c, "unauthorized")
			}

			claims, err := manager.Parse(token)
			if err != nil {
				return response.Unauthorized(c, "unauthorized")
			}

			authctx.SetUserID(c, claims.UserID)
			return next(c)
		}
	}
}

// CurrentUserID 获取 JWTAuth 写入的当前用户 ID；未登录或类型不匹配时返回 0。
func CurrentUserID(c echo.Context) uint {
	userID, ok := authctx.CurrentUserID(c)
	if !ok {
		return 0
	}
	return userID
}
