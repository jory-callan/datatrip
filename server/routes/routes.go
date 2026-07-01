package routes

import (
	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/features/auth"
	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/dsrule"
	"czwlinux.cloud/go-friday-starter/features/escalation"
	"czwlinux.cloud/go-friday-starter/features/poolstats"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/sqlfavorite"
	"czwlinux.cloud/go-friday-starter/features/sqlexec"
	"czwlinux.cloud/go-friday-starter/features/stats"
	"czwlinux.cloud/go-friday-starter/features/ticket"
	"czwlinux.cloud/go-friday-starter/features/user"
	"czwlinux.cloud/go-friday-starter/features/webhook"
	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx"
	"github.com/labstack/echo/v4"
)

func Register(e *echo.Echo) {
	v1 := e.Group("/api/v1")

	// 公开接口
	auth.RegisterRoutes(v1.Group("/auth"))

	// 受保护接口
	protected := v1.Group("")
	protected.Use(httpx.JWTAuth(global.JWT))

	// 当前用户
	protected.GET("/auth/me", user.NewHandler().Me)
	protected.PUT("/auth/profile", user.NewHandler().UpdateProfile)

	// 用户管理 — 需要 system_admin 权限
	users := protected.Group("/users")
	users.Use(auth.RequireRole(user.RoleSystemAdmin))
	user.RegisterRoutes(users)

	// 数据源管理 — 需要 system_admin 权限
	datasources := protected.Group("/datasources")
	datasources.Use(auth.RequireRole(user.RoleSystemAdmin))
	datasource.RegisterRoutes(datasources)

	// 项目（数据库分组）管理 — 需要 system_admin 权限
	projects := protected.Group("/projects")
	projects.Use(auth.RequireRole(user.RoleSystemAdmin))
	project.RegisterRoutes(projects)

	// 数据源规则管理 — 需要 system_admin 权限
	dsRules := protected.Group("/datasource-rules")
	dsRules.Use(auth.RequireRole(user.RoleSystemAdmin))
	dsrule.RegisterRoutes(dsRules)

	// SQL 执行 + 元数据浏览 — 受保护，权限在 handler/service 内部检查（项目成员即可）
	sqlexec.RegisterRoutes(protected)

	// 审计日志 — 需要 system_admin 权限
	audits := protected.Group("/audits")
	audits.Use(auth.RequireRole(user.RoleSystemAdmin))
	audit.RegisterRoutes(audits)

	// 工单（审批流）— 受保护，权限在 handler/service 内部检查
	tickets := protected.Group("/tickets")
	ticket.RegisterRoutes(tickets)

	// 提权管理 — 受保护，权限在 handler/service 内部检查
	escalations := protected.Group("/escalations")
	escalation.RegisterRoutes(escalations)

	// Webhook 配置 — 需要 system_admin 权限
	webhooks := protected.Group("/webhooks")
	webhooks.Use(auth.RequireRole(user.RoleSystemAdmin))
	webhook.RegisterRoutes(webhooks)

	// Dashboard 统计 — 需要登录
	stats.RegisterRoutes(protected)

	// 连接池监控 — 需要登录
	poolstats.RegisterRoutes(protected)

	// SQL 收藏 — 需要登录
	sqlfavorite.RegisterRoutes(protected)

	// 健康检查
	v1.GET("/health", func(c echo.Context) error {
		return c.String(200, "ok")
	})
}
