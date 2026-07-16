package auth

import (
	"context"
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
)

// HasPermission 检查用户的权限码集合是否能覆盖 requiredCode。
// 匹配规则：
//   - "*" 匹配全部（超级管理员）
//   - "db:*" 匹配 db 模块下所有权限（等价于 "db:*:*"）
//   - "db:datasource:*" 匹配 datasource 资源的所有操作
//   - "db:*:view" 匹配 db 模块下所有资源的 view 操作
//   - "db:project:view" 精确匹配
//   - "*:xxx" / "*:xxx:xxx"  禁止匹配（* 不在段首）
func HasPermission(userCodes []string, requiredCode string) bool {
	for _, code := range userCodes {
		if matchCode(code, requiredCode) {
			return true
		}
	}
	return false
}

func matchCode(pattern, target string) bool {
	// * 超级管理员，匹配全部
	if pattern == "*" {
		return true
	}

	// 不含通配符 → 精确匹配
	starIdx := strings.IndexByte(pattern, '*')
	if starIdx < 0 {
		return pattern == target
	}

	// * 在段首（如 "*:xxx"、"*:xxx:xxx"）→ 禁止
	if starIdx == 0 {
		return false
	}

	// 按第一个 * 拆分为前缀和后缀
	prefix := pattern[:starIdx]   // 如 "db:" / "db:datasource:" / "db:"
	suffix := pattern[starIdx+1:] // 如 "" / "" / ":view"

	// 去掉前缀末尾的 ":"，方便拼接
	prefix = strings.TrimSuffix(prefix, ":")

	if suffix == "" {
		// xx:* 模式 → 以 "prefix:" 开头即可（等价于 xx:*:*）
		return strings.HasPrefix(target, prefix+":") || target == prefix
	}

	// xx:*:zz 模式 → 前缀 + xxx + 后缀
	return strings.HasPrefix(target, prefix+":") && strings.HasSuffix(target, suffix)
}

// GetUserPermissionCodes 查询用户的所有权限码（通过角色-权限码链）。
// 表名通过对应模型的 TableName() 同步，保持与 GORM AutoMigrate 一致。
func GetUserPermissionCodes(ctx context.Context, userID string) ([]string, error) {
	var codes []string
	err := global.DB.WithContext(ctx).
		Table("sys_user_role ur").
		Select("DISTINCT p.code").
		Joins("JOIN sys_role_permission rp ON rp.role_id = ur.role_id").
		Joins("JOIN sys_permission p ON p.id = rp.permission_id").
		Where("ur.user_id = ?", userID).
		Where("ur.deleted_at IS NULL").
		Where("rp.deleted_at IS NULL").
		Where("p.deleted_at IS NULL").
		Pluck("p.code", &codes).Error
	if err != nil {
		return nil, err
	}
	if codes == nil {
		codes = []string{}
	}
	return codes, nil
}

// CheckUserPermission 一站式：查用户权限码 + 匹配判断。
func CheckUserPermission(ctx context.Context, userID string, requiredCode string) (bool, error) {
	codes, err := GetUserPermissionCodes(ctx, userID)
	if err != nil {
		return false, err
	}
	return HasPermission(codes, requiredCode), nil
}
