-- 중복된 권한 레코드 정리

USE jokercommunity;

-- 1. 먼저 중복된 권한 레코드 확인
SELECT 
    member_id,
    COUNT(*) as role_count,
    GROUP_CONCAT(id ORDER BY granted_at DESC) as role_ids
FROM member_role
WHERE member_id = 1 AND is_active = TRUE
GROUP BY member_id
HAVING COUNT(*) > 1;

-- 2. 가장 최근에 부여된 권한 하나만 남기고 나머지 비활성화
-- (가장 최근 granted_at을 가진 레코드만 유지)
UPDATE member_role
SET 
    is_active = FALSE,
    revoked_at = NOW(),
    revoked_by = 1
WHERE member_id = 1
AND is_active = TRUE
AND id NOT IN (
    SELECT id FROM (
        SELECT id 
        FROM member_role
        WHERE member_id = 1 AND is_active = TRUE
        ORDER BY granted_at DESC
        LIMIT 1
    ) AS temp
);

-- 3. 또는 중복 레코드 삭제 (비활성화 대신 삭제하려면)
-- DELETE FROM member_role
-- WHERE member_id = 1
-- AND is_active = TRUE
-- AND id NOT IN (
--     SELECT id FROM (
--         SELECT id 
--         FROM member_role
--         WHERE member_id = 1 AND is_active = TRUE
--         ORDER BY granted_at DESC
--         LIMIT 1
--     ) AS temp
-- );

-- 4. 정리 후 확인
SELECT 
    m.id,
    m.email,
    m.nickname,
    mr.id as role_record_id,
    mr.role,
    r.name as role_name,
    mr.is_active,
    mr.granted_at
FROM member m
LEFT JOIN member_role mr ON m.id = mr.member_id
LEFT JOIN role r ON mr.role_id = r.id
WHERE m.id = 1
ORDER BY mr.granted_at DESC;
