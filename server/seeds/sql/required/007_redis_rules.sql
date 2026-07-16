-- 必备数据：内置 Redis 正则规则。
-- 幂等规则：name 已存在时不覆盖。
-- type_group="nosql" 匹配所有 NoSQL 类型数据源，type_scope="" 不限定具体类型。
-- 由于 NoSQL 命令互不冲突（Redis/MongoDB 语法不同），type_scope 可留空。
-- 如需仅匹配 Redis，可设置 type_group="" AND type_scope="redis"。

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007001', 'Redis-KEYS', 'nosql', '', 'read', '^\s*KEYS\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-KEYS');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007002', 'Redis-GET', 'nosql', '', 'read', '^\s*GET\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-GET');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007003', 'Redis-MGET', 'nosql', '', 'read', '^\s*MGET\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-MGET');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007004', 'Redis-HGETALL', 'nosql', '', 'read', '^\s*HGETALL\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-HGETALL');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007005', 'Redis-SMEMBERS', 'nosql', '', 'read', '^\s*SMEMBERS\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-SMEMBERS');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007006', 'Redis-SET', 'nosql', '', 'write', '^\s*SET\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-SET');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f2000000000000000000000007007', 'Redis-DEL', 'nosql', '', 'write', '^\s*DEL\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'Redis-DEL');
