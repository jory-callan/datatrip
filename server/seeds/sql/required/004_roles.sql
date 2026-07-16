-- 必备数据：默认角色。
-- 幂等规则：code 已存在时不覆盖。

INSERT INTO sys_role (id, code, name, description, is_system, created_at, updated_at)
SELECT '00000000000000000000000000000010', 'platform_admin', '平台管理员', '系统全局管理，拥有所有权限', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'platform_admin');

INSERT INTO sys_role (id, code, name, description, is_system, created_at, updated_at)
SELECT '00000000000000000000000000000011', 'sql_admin', 'SQL 管理员', '数据库模块管理员，拥有 db 模块全部权限', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'sql_admin');

INSERT INTO sys_role (id, code, name, description, is_system, created_at, updated_at)
SELECT '00000000000000000000000000000012', 'sql_dev', 'SQL 开发者', '可浏览项目和执行 SQL', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'sql_dev');

INSERT INTO sys_role (id, code, name, description, is_system, created_at, updated_at)
SELECT '00000000000000000000000000000013', 'sql_viewer', 'SQL 查看者', '只读访问项目', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE code = 'sql_viewer');
