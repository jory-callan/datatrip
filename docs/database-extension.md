# 数据库类型扩展指南

> 本文档说明如何为 Jerry DB Manager 添加新的数据库类型支持，以及各数据库是否适合接入。

## 核心理念

Jerry DB Manager 是一个 **SQL 统一执行平台**，不是数据库管理客户端。它不模拟每种数据库的专属行为，而是：

1. 接受用户输入的 **标准 SQL**
2. 通过 `database/sql` 原生驱动执行
3. 返回统一格式的结果 `{ columns, rows }`

数据库类型只影响三件事：连接方式、驱动加载、元数据查询。执行层完全复用。

## 数据库分类

### ✅ 适合接入 — 标准 SQL 接口

这些数据库使用标准 SQL 作为查询语言，可通过 `database/sql` + 驱动接入：

| 类型 | 驱动包 | 备注 |
|------|--------|------|
| MySQL | `github.com/go-sql-driver/mysql` | 已验证 |
| MariaDB | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| TiDB | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| OceanBase MySQL | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| PolarDB MySQL | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| TDSQL MySQL | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| GreatSQL | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| GaussDB MySQL | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| Aurora MySQL | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| SingleStore | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| PolarDB-X | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| ClickHouse | `github.com/ClickHouse/clickhouse-go/v2` | SQL-over-HTTP |
| Doris | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| SelectDB | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| StarRocks | 复用 MySQL 驱动 | 兼容 MySQL 协议 |
| PostgreSQL | `github.com/jackc/pgx/v5/stdlib` | 已验证 |
| Greenplum | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| PolarDB PostgreSQL | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| AnalyticDB PostgreSQL | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| KingbaseES PostgreSQL | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| openGauss | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| GaussDB PostgreSQL | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| Vastbase | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| Redshift | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| SQL Server | `github.com/denisenkom/go-mssqldb` | TDS 协议 |
| Sybase | 复用 SQL Server 驱动 | 兼容 TDS 协议 |
| Oracle | `github.com/sijms/go-ora/v2` | OCI 协议 |
| OceanBase Oracle | 复用 Oracle 驱动 | 兼容 Oracle 协议 |
| PolarDB Oracle | 复用 Oracle 驱动 | 兼容 Oracle 协议 |
| KingbaseES Oracle | 复用 Oracle 驱动 | 兼容 Oracle 协议 |
| DB2 | `github.com/ibmdb/go_ibm_db` | DRDA 协议 |
| Dameng (达梦) | `github.com/si3nloong/sqlike` 或官方驱动 | 类 Oracle |
| GBase | 厂商提供 Go 驱动 | 类 Oracle |
| GoldenDB | 复用 MySQL 驱动 | 兼容 MySQL |
| SAP HANA | `github.com/SAP/go-hdb/driver` | SQL 标准 |
| GaussDB (DWS) | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| PegaDB | 复用 PostgreSQL 驱动 | 兼容 PG 协议 |
| Klustron | 复用 PostgreSQL 驱动 | 基于 PG |

### ⚠️ 有条件接入 — 需要额外适配

这些数据库使用类似 SQL 的语法，但连接或元数据有差异：

| 类型 | 注意事项 |
|------|---------|
| AWS RDS 系列 | 连接方式与对应原生数据库相同，只是网络配置可能有 VPC/SecurityGroup 限制 |
| AWS Aurora 系列 | 同上，使用对应 MySQL 或 PG 驱动 |
| Lindorm | 部分兼容 SQL 语法，部分查询需要通过专属驱动 |
| GaiaDB | 需要确认具体协议兼容性 |

### ❌ 不适合 — 非 SQL 协议

这些数据库不使用 SQL 作为查询语言，不适合当前架构：

| 类型 | 原因 | 替代方案 |
|------|------|----------|
| Redis | 使用 RESP 协议，不是 SQL | 需要独立功能模块（未来考虑） |
| AWS ElastiCache | 同上，Redis 协议 | 需要独立功能模块 |
| MongoDB | 使用 BSON/JSON 查询语言 | 需要独立功能模块 |
| Milvus | 向量数据库，使用 RESTful/gRPC API | 需要独立功能模块 |
| VectorDB | 向量数据库，非 SQL | 需要独立功能模块 |

## 扩展步骤

### 三步添加新数据库类型

以 Oracle 为例：

**Step 1：注册类型常量 + driver import**

```go
// features/datasource/model.go
const TypeOracle = "oracle"

// pkg/dbpool/pool.go + features/sqlexec/meta.go
import _ "github.com/sijms/go-ora/v2"
```

**Step 2：添加 DSN 构造**

```go
// pkg/dbpool/pool.go — buildDSN()
case datasource.TypeOracle:
    dsn := fmt.Sprintf("oracle://%s:%s@%s:%d/%s",
        ds.Username, ds.Password, ds.Host, ds.Port, ds.Database)
    return dsn, "oracle"
```

**Step 3：添加元数据查询**

```go
// features/sqlexec/meta.go — fetchDatabases() / fetchTables()
case datasource.TypeOracle:
    rows, err = conn.QueryContext(ctx, "SELECT username FROM all_users")
```

### mysql 兼容族的特殊处理

对于 MySQL 兼容数据库（TiDB、OceanBase MySQL 等），`type` 字段可以保留原始名称以便前端展示，但 `buildDSN` 和 `meta` 都复用 `mysql` 分支：

```go
// 定义一个映射，统一路由到实际驱动
var compatibleDrivers = map[string]string{
    "tidb":             "mysql",
    "oceanbase_mysql":  "mysql",
    "polardb_mysql":    "mysql",
    "tdsql_mysql":      "mysql",
    "greatsql":         "mysql",
    "aurora_mysql":     "mysql",
}

func actualDriver(dbType string) string {
    if driver, ok := compatibleDrivers[dbType]; ok {
        return driver
    }
    return dbType
}
```

## 不做的事

| 场景 | 原因 |
|------|------|
| 为每种数据库提供独立 API | SQL 执行模型完全一致，无需分化 |
| 为每种数据库适配专属 SQL 方言 | 用户自行编写适配当前数据库的 SQL，平台只负责传输+执行 |
| 为每种数据库提供可视化 DDL/DML | 范围太大，交给 DBeaver/DataGrip 等专业工具 |
| 自动 SQL 方言转换 | 高风险、低收益、难以测试全面 |
