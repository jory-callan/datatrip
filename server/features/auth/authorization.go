package auth

import (
	"context"

	"czwlinux.cloud/go-friday-starter/pkg/authctx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

// CheckPermissionByID 统一权限判断入口。
// 检查用户是否拥有 requiredCode 对应权限。
func CheckPermissionByID(ctx context.Context, userID string, requiredCode string) bool {
	if userID == "" {
		return false
	}
	ok, err := CheckUserPermission(ctx, userID, requiredCode)
	if err != nil {
		return false
	}
	return ok
}

// RequirePermission 返回 Echo 中间件，校验当前用户是否拥有指定权限码。
func RequirePermission(code string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userID, ok := authctx.CurrentUserID(c)
			if !ok {
				return response.Unauthorized(c, "unauthorized")
			}
			if !CheckPermissionByID(c.Request().Context(), userID, code) {
				return response.Forbidden(c, "forbidden")
			}
			return next(c)
		}
	}
}

// Deprecated: RequireRole 保持向后兼容，实际使用 RequirePermission 替换。
// 参数 allowedCodes 被视为权限码列表（任一匹配即放行）。
func RequireRole(allowedCodes ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userID, ok := authctx.CurrentUserID(c)
			if !ok {
				return response.Unauthorized(c, "unauthorized")
			}
			codes, err := GetUserPermissionCodes(c.Request().Context(), userID)
			if err != nil {
				return response.Forbidden(c, "forbidden")
			}
			for _, allowed := range allowedCodes {
				if HasPermission(codes, allowed) {
					return next(c)
				}
			}
			return response.Forbidden(c, "forbidden")
		}
	}
}
