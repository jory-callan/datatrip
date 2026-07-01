# SQL 执行流程

> 本文档描述 Jerry DB Manager 中 SQL 执行的完整决策树。
> 包括分类器、特权判断、提权机制和工单流转。

## 完整流程图

```
用户点击「执行」
   ↓
[1] 接收 SQL
   ↓
[2] 权限检查
   ├─ 未登录 → 401
   └─ 已登录 → 继续
   ↓
[3] SQL 预处理
   ├─ 多语句拆分（按分号）
   ├─ 去除注释
   └─ Trim
   ↓
[4] SQL 分类
   ├─ 命中 HIGH_RISK 规则 → 拒绝（422）
   ├─ 任一语句命中 WRITE 规则 → WRITE
   ├─ 全部无法识别 → 按 WRITE 处理
   └─ 全是 READ → READ
   ↓
[5] 业务特判
   ├─ 超管 (is_system_admin) → 直接执行
   ├─ 项目 owner → 直接执行
   ├─ 有活跃提权 → 直接执行
   └─ 普通用户 → 走工单
   ↓
[6] 执行 / 工单
   ├─ READ → 执行 → 返回结果 → 写审计
   ├─ WRITE (有特权) → 执行 → 写审计
   └─ WRITE (无特权) → 创建工单(pending) → 返回工单号
```

## 分类器详解

### 三种分类

```go
const (
    READ      = "read"       // SELECT
    WRITE     = "write"      // INSERT/UPDATE/DELETE/REPLACE
    HIGH_RISK = "high_risk"  // DROP/TRUNCATE/ALTER/GRANT
)
```

### 判断逻辑

```go
func Classify(sql string) string {
    statements := splitMultiStatements(sql)
    
    for _, stmt := range statements {
        // HIGH_RISK 优先
        if matchesAny(stmt, highRiskPatterns) {
            return HIGH_RISK
        }
    }
    
    for _, stmt := range statements {
        if matchesAny(stmt, writePatterns) {
            return WRITE
        }
    }
    
    // 全部无法识别 → 按写处理
    return WRITE
}
```

### 规则来源

- **系统预置规则**：通过 `seeds/sql/required/002_ds_rules.sql` 写入
- **管理员自定义**：通过数据源规则管理 API 维护
- **项目级启用**：项目选择启用哪些规则

### 默认高危规则

```sql
-- 包含这些关键词的语句会被识别为 HIGH_RISK
DROP, TRUNCATE, ALTER, GRANT, REVOKE
```

### 默认写规则

```sql
-- 包含这些关键词的语句会被识别为 WRITE
INSERT, UPDATE, DELETE, REPLACE
```

## 业务特判详解

### handler 内统一判断

```go
func ExecuteSQL(c *gin.Context) {
    user := getUser(c)
    projectID := c.Param("id")
    sql := getSQL(c)
    
    // 业务特判 1：是项目成员吗？
    if !dbauth.IsProjectMember(user.ID, projectID) {
        return 403, "NOT_PROJECT_MEMBER"
    }
    
    // 业务特判 2：超管/owner 一票通过
    if user.IsSystemAdmin {
        return executeAndAudit(user, projectID, sql, "system_admin")
    }
    if dbauth.IsProjectOwner(user.ID, projectID) {
        return executeAndAudit(user, projectID, sql, "owner")
    }
    
    // 业务特判 3：SQL 分类
    category := sqlclassifier.Classify(sql)
    if category == sqlclassifier.HIGH_RISK {
        return 422, "HIGH_RISK_BLOCKED"
    }
    
    // 业务特判 4：读 SQL 直接执行
    if category == sqlclassifier.READ {
        return executeAndAudit(user, projectID, sql, "read")
    }
    
    // 业务特判 5：写 SQL 看提权
    if category == sqlclassifier.WRITE {
        if dbauth.HasActiveEscalation(user.ID, projectID, time.Now()) {
            return executeAndAudit(user, projectID, sql, "escalation")
        }
        return createTicketAndRespond(user, projectID, sql)
    }
}
```

### 业务特判 helper 函数

```go
// features/project/auth.go 或 features/auth/dbauth.go
package dbauth

func IsProjectMember(userID, projectID int64) bool
func IsProjectOwner(userID, projectID int64) bool
func IsProjectApprover(userID, projectID int64) bool
func HasActiveEscalation(userID, projectID int64, now time.Time) bool
```

## 提权机制

### 提权表

```sql
db_escalations:
  id
  user_id           -- 谁能用
  project_id        -- 在哪个项目
  reason            -- 提权原因
  granted_by        -- 谁批的（owner）
  expires_at        -- 到期时间
  revoked_at        -- 主动撤销时间
  status            -- "active" | "expired" | "revoked"
  created_at
```

### 提权生命周期

```
developer 申请提权
   ↓
POST /db/projects/:id/escalations
  body: { expires_at, reason }
   ↓
状态: pending
   ↓
owner 审批
   ↓
   ├─ 批准 → 状态: active
   │         ↓
   │       提权生效（至 expires_at）
   │         ↓
   │       developer 在有效期内可绕过工单直接写
   │         ↓
   │       到期 → 状态: expired
   │
   └─ 拒绝 → 状态: rejected
   ↓
owner 可随时主动撤销 → 状态: revoked
```

### 提权 vs 工单

| 维度 | 提权 | 工单 |
|------|------|------|
| 适用场景 | 紧急、临时、多次操作 | 单次、需多人审批 |
| 速度 | 即时 | 等待审批 |
| 审计 | 单条审计 + 提权记录 | 工单 + 执行审计 |
| 撤销 | 主动撤销 / 到期失效 | 工单完成 / 拒绝 |
| 申请人 | developer | developer |
| 审批人 | project_owner | approver / project_owner |

## 执行审计

### 审计元信息

```go
type AuditLog struct {
    ID            int64
    ActorID       int64     // 操作人（系统执行时为 0）
    ProjectID     int64
    DatasourceID  int64
    Action        string    // "execute_read" | "execute_write" | "create_ticket" | "approve" | "reject" | "escalation"
    SQL           string    // 完整 SQL
    Classification string   // "read" | "write" | "high_risk"
    Status        string    // "success" | "failed"
    DurationMs    int64
    ErrorMessage  string
    TicketID      int64     // 关联工单（如果有）
    IP            string
    CreatedAt     time.Time
}
```

### 审计触发点

| 触发点 | 写入审计 |
|--------|----------|
| 读 SQL 执行成功 | ✓ |
| 读 SQL 执行失败 | ✓ |
| 写 SQL 创建工单 | ✓ |
| 工单审批通过 | ✓ |
| 工单审批拒绝 | ✓ |
| 工单自动执行成功 | ✓（actor=system, ticket_id 关联）|
| 工单自动执行失败 | ✓ |
| 提权申请/批准/拒绝/撤销 | ✓ |
| 提权状态下的写操作 | ✓（action="escalation"）|

## Webhook 事件

| 事件 | 触发时机 |
|------|----------|
| `ticket.created` | 工单创建 |
| `ticket.approved` | 审批通过 |
| `ticket.partially_approved` | all 模式下部分通过 |
| `ticket.rejected` | 审批拒绝 |
| `ticket.executed` | 自动执行成功 |
| `ticket.execution_failed` | 自动执行失败 |
| `ticket.urged` | 工单催办 |

## 工单状态机

```
pending ─┐
         │ owner 拒绝 / 主动撤销
         ↓
      rejected

pending ─┐
         │ 审批通过
         ↓
      approved ─┐
                │ 后台开始执行
                ↓
            executing ─┬─ 成功 → executed
                        └─ 失败 → execute_failed
```

## 关键边界

- **审计只存元信息**：不存完整查询结果
- **SQL 不可变**：工单存 SQL 快照，审批后只执行快照
- **不跨库事务**：工单状态和 SQL 执行分别记录，通过审计保证可追踪
- **高危默认禁**：DROP/TRUNCATE/ALTER 不允许（除非管理员特别配置）
- **不可识别按写处理**：避免解析器漏判导致误执行
