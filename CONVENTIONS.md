# CONVENTIONS.md — 系统架构与项目宪法

> 项目发展的"活档案"。这里只放**跨栈的架构决策和系统设计**。
> 技术栈的具体约定见 `server/CONVENTIONS.md`（后端）和 `web/CONVENTIONS.md`（前端）。
>
> **新增约定**：开发过程中发现未记录的技术约定或用户偏好，直接追加到下文对应章节，
> 不需要经过"写不写"的思考。

---

## 项目边界

- 个人项目，优先简单直接
- 不使用 DI 容器
- 不默认创建 interface
- 不默认抽 BaseRepo
- 不默认写测试，除非用户明确要求
- 所有接口字段以代码为准，不维护外部 API 契约文件
- 当前版本用 git log 追踪，不维护独立版本文档
- 开发数据库：SQLite（文件 `demo.sqlite.db`）

## 核心概念

| 概念 | 说明 |
|---|---|
| **数据源（Datasource）** | 数据库实例连接信息（类型、host、port、账号密码） |
| **数据项目（Project）** | 访问边界，绑定一个数据源 + N 个 database |
| **SQL 规则（DS Rule）** | 按 db_type 匹配的正则规则，分 READ / WRITE / HIGH_RISK |
| **工单（Ticket）** | 写操作的审批单元，包含不可变 SQL 快照 |
| **提权（Escalation）** | developer 临时绕过工单的写权限，有 TTL |

## 架构红线（不可违反）

### 1. 双库隔离

```
平台元数据库（GORM）             被管理数据库（原生 database/sql）
┌────────────────────┐          ┌────────────────────────────┐
│ users              │          │ MySQL / PostgreSQL 实例     │
│ datasources        │          │                            │
│ db_projects        │          │ 执行用户 SQL、浏览库表      │
│ tickets            │          │                            │
│ audit_logs         │          │ 两类连接完全隔离            │
│ ...                │          └────────────────────────────┘
│ ⚠ 不做用户 SQL     │
└────────────────────┘
```

- **GORM 只操作平台元数据库，永不执行用户 SQL**
- 被管理数据库使用原生 `database/sql` 直接执行用户语句
- 两类数据库的驱动、连接池、事务边界完全独立

### 2. 连接池策略

- **懒加载**：系统启动不为数据源建连接池，按 `datasource_id` 第一次 SQL 执行时创建
- **复用**：多项目引用同一数据源 → 复用同一连接池
- **释放**：空闲超时自动释放；配置变更关闭旧池
- **测试隔离**：连接测试用临时连接，用完即关，不进入连接池

### 3. SQL 执行流程

```
用户选中 SQL → 执行
      ↓
  SQL 分类器（正则匹配）
      ↓
 ├─ HIGH_RISK（DROP/TRUNCATE/ALTER） → 拒绝执行
 ├─ READ（SELECT / SHOW / DESCRIBE） → 直接执行 → 审计
 ├─ WRITE（INSERT / UPDATE / DELETE） → 创建工单 → 审批 → 系统自动执行快照
 └─ 无法识别 → 返回错误，不执行
```

- 多语句按分号拆分，逐条匹配
- 任一命中 HIGH_RISK → 整批拒绝
- 任一命中 WRITE → 整批走工单
- 查询默认最多 10,000 行，SQL 超时 30 秒

### 4. 工单状态机

```
pending → approved → executing → executed
   │         │           │
   │         │           └→ execute_failed
   │         │
   │         └→ rejected（任一审批人拒绝）
   │
   └→ rejected（主动撤销 / all 模式下拒绝）
```

- 工单 SQL 在**提交时存快照**，审批后不可修改
- 审批模式：`any_one`（任一通过即执行）/ `all`（全部通过）
- project_owner 可兜底放行，走同一审计
- 通过后系统自动执行快照，不依赖人工操作

### 5. 权限模型

5 种角色，用 `role_code` 字符串标识，不做 permission 中间表：

| 角色 | 权限 |
|---|---|
| `system_admin` | 全局管理：用户、数据源、项目、规则、webhook、审计 |
| `project_owner` | 项目级管理：成员、审批配置、兜底放行工单 |
| `developer` | 读 SQL，提交写工单 |
| `viewer` | 只读 |
| `approver` | 审批指定项目的写工单 |

**权限判断统一写在一个 switch 文件**（`features/auth/authorization.go`），不散落到 handler/service。

> `system_admin` 不默认拥有项目 SQL 执行权。

### 6. 核心数据流

```
用户登录 → JWT Token
   ↓
SQL 工作台 → 选项目 → 编 SQL → 执行
   ↓
[分类器] 读/写/高危？
   ↓
   ├ 读   → [连接池] 执行 → VTable 展示 → 写审计
   ├ 写   → 创建工单 → 审批流 → 系统执行快照 → 写审计 → Webhook
   └ 高危 → 拒绝
```

### 7. 关键安全默认

- DROP/TRUNCATE/ALTER 默认禁止
- 密码读写走统一入口（`pkg/password`），为后续加密留坑位
- 审计只存元信息（操作人、SQL、耗时、状态、IP），不存结果集
- 多语句中任意语句不可识别 → 返回错误，不降级执行
- 响应格式统一：`{ code, msg, data }`

## 当前不做

- Oracle / MongoDB / Redis 等非 MySQL/PG 数据源
- SSO / OAuth / LDAP
- 字段级 / 行级权限
- 查询结果脱敏与导出
- 审批组 / 顺序审批
- Webhook 回调审批
- 可视化增删改查
- 国际化（代码保留但不再迭代，未来按需启用）

## 决策记录

> 按时间倒序排列。每次出现新的技术偏好、弃用、重构决策，追加到最前面。

### 2026-06-28 文档重构定稿
- 根 `CLAUDE.md` = `AGENTS.md` 完全一致（copy 关系）
- 根 `CONVENTIONS.md` 仅保留系统架构 + 项目宪法，不包含技术栈约定
- 技术栈约定全部下沉到 `server/CONVENTIONS.md` 和 `web/CONVENTIONS.md`
- 移除国际化（i18n），代码保留但不再迭代
- 移除 `沟通约定` 章节（已在 AGENTS.md 中）
- AGENTS.md 新增"知识沉淀"和"自动优化"规则

### 2026-06-28 统一文档结构：CONVENTIONS.md 引入
- 概念分离：AGENTS = AI 行为规则 + 项目入口，CONVENTIONS = 项目技术约定 + 决策记录
- 删除 `docs/` 下冗余文件（archive、product、requirements、version、progress.yaml）
- 删除 `web/docs/dev-paradigm.md`、`web/README.md`
- 删除 `server/pkg/cache/README.md`、`server/pkg/database/README.md`
- 删除 AGENTS.md（旧版）、README.md、ARCHITECTURE.md

### 2026-06-28 dev.sh 重写
- 改用纯端口杀进程（PID 文件方式废弃）
- 端口固定：server=8080, web=5173
- 命令：start/stop/restart/web/server/status/logs

### 2026-06-07 项目初始化
- 前端：React 19 + TypeScript + Vite + pnpm + shadcn/ui + TailwindCSS 4
- 后端：Go + Echo + GORM + SQLite（开发）
- 路由：react-router-dom v7 createBrowserRouter
- 状态管理：@tanstack/react-query（服务端）+ zustand（客户端）
- HTTP 客户端：ofetch
- 表格：@tanstack/react-table + shadcn/ui Table
- 图标：lucide-react + @tabler/icons-react
- 开发数据库：SQLite 文件 demo.sqlite.db
- 被管理数据库：MySQL / PostgreSQL
- 元数据库和被管理库严格隔离
- 关闭版本文档追踪，用 git log 替代
- 删除 api_contract.yaml，接口以代码为准
