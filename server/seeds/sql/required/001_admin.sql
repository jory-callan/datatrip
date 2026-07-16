-- 必备数据：默认系统管理员账号。
-- 幂等规则：username 已存在时不覆盖。

INSERT INTO sys_user (id, username, password_hash, nickname, email, phone, status, created_at, updated_at)
SELECT '01950000000000000000000000000001', 'admin', 'admin123', '超级管理员', '', '', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'admin');
