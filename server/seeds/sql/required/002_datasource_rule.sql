-- 必备数据：内置 SQL 正则规则。
-- 幂等规则：name 已存在时不覆盖。
-- type_group="sql" 匹配所有 SQL 类型数据源，type_scope="" 表示不限定具体类型。
-- priority 越小越优先。

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a148a9e11695fe20918', 'SELECT', 'sql', '', 'read', '^\s*SELECT\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'SELECT');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a15a10db5b77499d244', 'INSERT', 'sql', '', 'write', '^\s*INSERT\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'INSERT');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a16a9f926b3ea935f5a', 'UPDATE', 'sql', '', 'write', '^\s*UPDATE\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'UPDATE');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a1789be56871745ed89', 'DELETE', 'sql', '', 'write', '^\s*DELETE\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'DELETE');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a18a00c61aaeac7223b', 'CREATE', 'sql', '', 'dangerous', '^\s*CREATE\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'CREATE');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a19a70aebdec4b48dd2', 'ALTER', 'sql', '', 'dangerous', '^\s*ALTER\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'ALTER');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a1aab839caaad15808c', 'DROP', 'sql', '', 'dangerous', '^\s*DROP\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'DROP');

INSERT INTO data_datasource_rule (id, name, type_group, type_scope, category, pattern, enabled, priority, created_at, updated_at)
SELECT '019f1435c4fd7a1badd7646f8839098e', 'TRUNCATE', 'sql', '', 'dangerous', '^\s*TRUNCATE\b', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM data_datasource_rule WHERE name = 'TRUNCATE');
