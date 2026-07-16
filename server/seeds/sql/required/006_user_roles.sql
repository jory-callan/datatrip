-- 必备数据：默认用户-角色关联。
-- 给 admin 用户分配 platform_admin 角色。
-- 幂等规则：user_id + role_id 组合已存在时不覆盖。

INSERT INTO sys_user_role (id, user_id, role_id, created_at, updated_at)
SELECT '00000000000000000000000000000060', u.id, r.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM sys_user u, sys_role r
WHERE u.username = 'admin' AND r.code = 'platform_admin'
AND NOT EXISTS (
    SELECT 1 FROM sys_user_role ur WHERE ur.user_id = u.id AND ur.role_id = r.id
);
