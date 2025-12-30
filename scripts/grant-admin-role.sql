-- ============================================
-- 관리자 권한 부여 스크립트
-- ============================================
-- kju0606@naver.com 사용자에게 관리자 권한 부여

-- 데이터베이스 선택
USE jokercommunity;

-- ============================================
-- 사용자 찾기 및 확인
-- ============================================
SET @target_email = 'kju0606@naver.com';
SET @member_id = NULL;

-- 이메일로 사용자 찾기
SELECT id INTO @member_id FROM member WHERE email = @target_email LIMIT 1;

-- 사용자 정보 확인
SELECT 
    id,
    email,
    nickname,
    '권한 부여 대상' as status
FROM member 
WHERE email = @target_email;

-- ============================================
-- 방법 1: role_id를 사용하는 방법 (권장)
-- ============================================
INSERT INTO member_role (member_id, role_id, role, is_active, granted_at)
SELECT 
    @member_id,  -- member id
    r.id,  -- ADMIN 역할의 ID
    'admin',  -- 기존 호환성을 위한 문자열
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

-- ============================================
-- 방법 2: role 컬럼만 사용하는 방법 (기존 호환성)
-- ============================================
-- 만약 role_id가 NULL이어도 작동해야 한다면
INSERT INTO member_role (member_id, role, is_active, granted_at)
VALUES (@member_id, 'admin', TRUE, NOW())
ON DUPLICATE KEY UPDATE
    role = 'admin',
    is_active = TRUE,
    revoked_at = NULL,
    revoked_by = NULL,
    granted_at = NOW();

-- ============================================
-- 기존 비활성화된 권한이 있다면 활성화
-- ============================================
UPDATE member_role
SET 
    role_id = (SELECT id FROM role WHERE name = 'ADMIN'),
    role = 'admin',
    is_active = TRUE,
    revoked_at = NULL,
    revoked_by = NULL,
    granted_at = NOW()
WHERE member_id = @member_id
AND (is_active = FALSE OR role != 'admin' OR role_id IS NULL);

-- ============================================
-- 확인 쿼리: 권한이 제대로 부여되었는지 확인
-- ============================================
SELECT 
    m.id,
    m.email,
    m.nickname,
    mr.role,
    r.name as role_name,
    r.display_name as role_display_name,
    mr.is_active,
    mr.granted_at,
    CASE 
        WHEN mr.is_active = TRUE AND r.name = 'ADMIN' THEN '✅ 관리자 권한 부여 완료'
        ELSE '❌ 권한 부여 실패'
    END as status
FROM member m
LEFT JOIN member_role mr ON m.id = mr.member_id AND mr.is_active = TRUE
LEFT JOIN role r ON mr.role_id = r.id
WHERE m.id = @member_id;
