-- 必备数据：默认系统管理员账号。
-- 幂等规则：username 已存在时不覆盖。
-- 密码使用明文存储（password.Hash 目前处于明文模式）

INSERT INTO user (username, password_hash, nickname, role_code, status, created_at, updated_at)
SELECT 'admin', 'admin123', '超级管理员', 'system_admin', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM user WHERE username = 'admin');
