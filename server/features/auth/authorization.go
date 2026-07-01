package auth

import (
	"context"

	"czwlinux.cloud/go-friday-starter/features/user"
	"czwlinux.cloud/go-friday-starter/global"
	"go.uber.org/zap"
)

// CheckPermissionByID 统一权限判断入口
// 所有 handler 应通过此函数判断用户角色权限，不自行查询用户表
func CheckPermissionByID(ctx context.Context, userID uint, allowedCodes ...string) bool {
	if userID == 0 {
		return false
	}
	u, err := user.GetByID(ctx, userID)
	if err != nil {
		global.Log.Warn("permission check: user not found", zap.Uint("user_id", userID))
		return false
	}
	for _, code := range allowedCodes {
		if u.RoleCode == code {
			return true
		}
	}
	return false
}
