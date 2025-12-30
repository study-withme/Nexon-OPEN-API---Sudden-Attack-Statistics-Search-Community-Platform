-- ============================================
-- 멤버 ID 1번에게 관리자 권한 부여 (간단 버전)
-- ============================================

USE jokercommunity;

-- 관리자 권한 부여
INSERT INTO member_role (member_id, role_id, role, is_active, granted_at)
SELECT 
    1,
    r.id,
    'admin',
    TRUE,
    NOW()
FROM role r
WHERE r.name = 'ADMIN'
ON DUPLICATE KEY UPDATE
    role_id = r.id,
    role = 'admin',
    is_active = TRUE,
    revoked_at = NULL,
    revoked_by = NULL,
    granted_at = NOW();

-- 확인
SELECT 
    m.id,
    m.email,
    m.nickname,
    r.name as role_name,
    mr.is_active,
    '✅ 관리자 권한 부여 완료' as status
FROM member m
JOIN member_role mr ON m.id = mr.member_id AND mr.is_active = TRUE
JOIN role r ON mr.role_id = r.id
WHERE m.id = 1 AND r.name = 'ADMIN';
