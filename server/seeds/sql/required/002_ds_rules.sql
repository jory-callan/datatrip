-- 必备数据：内置 SQL 正则规则。
-- 幂等规则：name 已存在时不覆盖。
-- 这些规则匹配对应 SQL 关键字的正则表达式，用于分类和拦截。

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'SELECT', 'all', 'read', '^\s*SELECT\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'SELECT');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'INSERT', 'all', 'write', '^\s*INSERT\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'INSERT');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'UPDATE', 'all', 'write', '^\s*UPDATE\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'UPDATE');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'DELETE', 'all', 'write', '^\s*DELETE\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'DELETE');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'CREATE', 'all', 'danger', '^\s*CREATE\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'CREATE');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'ALTER', 'all', 'danger', '^\s*ALTER\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'ALTER');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'DROP', 'all', 'danger', '^\s*DROP\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'DROP');

INSERT INTO ds_rule (name, db_type, category, pattern, enabled, created_at, updated_at)
SELECT 'TRUNCATE', 'all', 'danger', '^\s*TRUNCATE\b', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM ds_rule WHERE name = 'TRUNCATE');
