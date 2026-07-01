# 权限架构

> 本文档描述 Jerry DB Manager 的权限模型设计。
> 当前 v0.2.0 沿用 role_code 方案（5 个角色 + 业务表），v0.3.0 计划重构为"入口权限码 + 业务特判"。

## 设计演进

| 版本 | 模型 | 状态 |
|------|------|------|
| v0.1.0 / v0.2.0 | role_code（5 个角色）+ 业务表 | 当前已实现 |
| v0.3.0（规划） | 入口权限码 + 业务特判 6 张表 | 待实施 |

---

# 当前实现（v0.2.0）

## 角色模型

```sql
-- User 表有 role_code 字段
users (id, username, password, role_code, ...)

-- 5 个 role_code 值
'system_admin'   -- 系统管理员
'project_owner'  -- 项目负责人
'developer'      -- 开发人员
'viewer'         -- 只读用户
'approver'       -- 审批人
```

## 项目级配置

```sql
db_projects (id, name, ..., 
  project_owner_ids,    -- 项目级 owner
  approver_ids,         -- 项目级审批人
  approval_mode,        -- "any_one" | "all"
  ...
)

project_members (project_id, user_id, role)
-- role: "developer" | "viewer"
```

## 角色实际能做什么

| role_code | 实际权限 |
|---|---|
| `system_admin` | 管元数据（用户/数据源/规则/Webhook），**不能直接执行项目 SQL** |
| `project_owner` | 必须在 `db_projects.project_owner_ids` 里 → 兜底放行 |
| `approver` | 必须在 `db_projects.approver_ids` 里 → 审批工单 |
| `developer` | 必须被加为 `project_members` → 读 + 提写工单 |
| `viewer` | 必须被加为 `project_members` → 只能读 |

## 统一权限判断

所有权限判断集中在 `features/auth/authorization.go`，不分散到 handler。

```go
// 伪代码
func CanDo(user User, action string, resource ...any) bool {
    switch action {
    case "execute_write_sql":
        if user.RoleCode == "system_admin" { return false }  // 超管也不默认有
        if isProjectOwner(user.ID, project.ID) { return true }
        if user.RoleCode == "developer" || isProjectMember(user.ID, project.ID) {
            return true
        }
    // ...
    }
}
```

## 已知问题

1. **role_code 冗余**：4/5 的角色都在项目级被重新定义，User.role_code 字段信息冗余
2. **超管反直觉**：system_admin 不默认有项目 SQL 执行权，要干活必须被加为项目成员
3. **跨项目角色表达分散**：4 张表（users/project_members/db_projects）共同决定
4. **未来扩展难**：加新模块要重新设计 role 列表

---

# 目标设计（v0.3.0 规划）

## 核心思想

**所有权限都基于 permission code 统一表达，业务特判在 handler 内做。**

```
权限码 = 入口钥匙（粗粒度，一对多）
业务表 = 实际数据（细粒度，handler 查）
代码内置 = 交互逻辑（每个 handler 自己写）
```

## 数据模型（6 张表）

```sql
-- 1. 用户
users (
  id, username, password, nickname, status,
  is_system_admin BOOL DEFAULT FALSE,  -- 唯一硬编码的全局标志
  created_at
)

-- 2. 角色（可选，推荐）
roles (id, code, name, description, is_system)

-- 3. 权限码
permissions (id, code, description)
  -- db 模块只 7 个入口级权限码

-- 4. 角色-权限
role_permissions (role_id, permission_id)

-- 5. 用户授权
user_roles (user_id, role_id, scope_type, scope_id)
  -- scope 可选：NULL (全局) | ("project", 1)
  -- 或 user_permissions 直接绑权限码

-- 6. 业务表（每个模块自己）
db_projects (id, name, owner_ids, approver_ids, ...)
db_project_members (project_id, user_id, role, can_approve, created_at)
```

**owner / approver 不进 roles 表，存业务表字段。**

## db 模块入口权限码（7 个，一对多）

```yaml
# 平台级
platform:user:manage       # 管用户
platform:module:manage     # 模块开关

# db 模块入口级
db:project:access          # 项目访问
  - GET    /db/projects
  - GET    /db/projects/:id
  - GET    /db/projects/:id/members
  - GET    /db/projects/:id/sql-history
  - GET    /db/projects/:id/tickets
  - GET    /db/tickets/:id

db:project:execute_sql     # 执行 SQL
  - POST   /db/projects/:id/sql/execute

db:project:manage          # 管项目
  - POST   /db/projects
  - PUT    /db/projects/:id
  - DELETE /db/projects/:id
  - PUT    /db/projects/:id/members

db:project:manage_escalation  # 管提权
  - GET    /db/projects/:id/escalations
  - POST   /db/projects/:id/escalations
  - PUT    /db/escalations/:id/approve
  - PUT    /db/escalations/:id/reject

db:ticket:approve          # 审批工单
  - POST   /db/tickets/:id/approve
  - POST   /db/tickets/:id/reject

db:audit:view              # 看审计
  - GET    /db/audits
  - GET    /db/audits/:id

db:rule:manage             # 管规则

db:datasource:manage       # 管数据源
```

**7 个权限码覆盖 25+ 个 API。**

## 角色（推荐）

```yaml
platform_admin:
  - "platform:*"
  - "db:*"

sql_viewer:               # 默认注册用户
  - "db:project:access"

sql_dev:
  - "db:project:access"
  - "db:project:execute_sql"
```

## 通用中间件

```go
// 平台级
func RequireAuth() gin.HandlerFunc { ... }
func RequireSystemAdmin() gin.HandlerFunc { ... }

// 业务级
func RequirePermission(code string) gin.HandlerFunc { ... }
```

## Handler 业务特判模式

```go
// 统一决策树
func ExecuteSQL(c *gin.Context) {
    user := getUser(c)  // 中间件已确保有 db:project:execute_sql
    projectID := c.Param("id")
    
    // 业务特判
    if user.IsSystemAdmin || isProjectOwner(user.ID, projectID) {
        return executeAndAudit(...)
    }
    
    // 业务特判：提权
    if hasActiveEscalation(user.ID, projectID, time.Now()) {
        return executeAndAudit(...)
    }
    
    // 业务特判：SQL 分类
    category := classifySQL(sql)
    if category == HIGH_RISK { return 422 }
    if category == READ { return executeAndAudit(...) }
    if category == WRITE { return createTicket(...) }
}
```

## 业务特判 helper 函数（内置到代码）

```go
package dbauth

func IsProjectMember(userID, projectID int64) bool
func IsProjectOwner(userID, projectID int64) bool
func IsProjectApprover(userID, projectID int64) bool
func HasActiveEscalation(userID, projectID int64, now time.Time) bool
func CanApproveTicket(userID, projectID int64) bool
```

## v0.3.0 迁移步骤

1. 数据模型迁移（建 6 张表，迁移老数据）
2. Seed 7 个权限码 + 3 个角色
3. 实现 RequireAuth / RequirePermission 中间件
4. 30+ API 挂权限码中间件
5. handler 加业务特判（统一调用 dbauth 包）
6. 删冗余字段（users.role_code）
7. 回归测试
8. 前端适配（用户管理/角色管理 UI）

## 扩展新模块

```yaml
# 堡垒机：4-5 个权限码
bastion:host:access
bastion:host:connect
bastion:host_group:manage
bastion:session:audit

# 文档：3-4 个权限码
doc:space:access
doc:space:edit
doc:space:manage
```

**每个模块 3-7 个权限码就够，零侵入 db 模块。**

## 完整错误码

```
401 UNAUTHORIZED             - 未登录
403 NO_API_PERMISSION        - 没有 API 权限码
403 NOT_PROJECT_MEMBER       - 不是项目成员
403 NOT_PROJECT_OWNER        - 不是项目 owner
403 NOT_PROJECT_APPROVER     - 不是项目 approver
422 HIGH_RISK_BLOCKED        - 高危 SQL 禁止
422 SQL_CLASSIFY_FAILED      - SQL 分类失败
```

## 迁移工作量评估

| 任务 | 工作量 |
|---|---|
| 数据模型 + 迁移脚本 | 2 天 |
| Seed 7 个权限码 + 3 个角色 | 0.5 天 |
| 中间件 RequireAuth / RequirePermission | 1 天 |
| 改造 30+ API（加权限码） | 2 天 |
| handler 业务特判（含超管/owner 特权） | 2 天 |
| 删冗余字段（users.role_code 等） | 0.5 天 |
| 回归测试 | 2 天 |
| 前端适配 | 1.5 天 |
| 文档更新 | 1 天 |
| **合计** | **12.5 天** |
