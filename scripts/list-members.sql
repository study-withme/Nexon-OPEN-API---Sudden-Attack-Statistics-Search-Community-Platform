-- 회원목록 조회

-- 데이터베이스 선택
USE jokercommunity;

-- 전체 회원 목록 조회 (기본 정보)
SELECT 
    id,
    email,
    nickname,
    ouid,
    clan_name,
    title_name,
    manner_grade,
    created_at,
    updated_at
FROM member
ORDER BY id ASC;

-- 회원 목록 + 권한 정보 포함
SELECT 
    m.id,
    m.email,
    m.nickname,
    m.ouid,
    m.clan_name,
    m.title_name,
    m.manner_grade,
    mr.role as role_string,
    r.name as role_name,
    r.display_name as role_display_name,
    mr.is_active as role_active,
    m.created_at,
    m.updated_at
FROM member m
LEFT JOIN member_role mr ON m.id = mr.member_id AND mr.is_active = TRUE
LEFT JOIN role r ON mr.role_id = r.id
ORDER BY m.id ASC;

-- 특정 이메일로 검색
SELECT 
    m.id,
    m.email,
    m.nickname,
    m.ouid,
    mr.role as role_string,
    r.name as role_name,
    mr.is_active as role_active,
    m.created_at
FROM member m
LEFT JOIN member_role mr ON m.id = mr.member_id AND mr.is_active = TRUE
LEFT JOIN role r ON mr.role_id = r.id
WHERE m.email = 'kju0606@naver.com';

-- ID로 검색
SELECT 
    m.id,
    m.email,
    m.nickname,
    m.ouid,
    mr.role as role_string,
    r.name as role_name,
    mr.is_active as role_active,
    m.created_at
FROM member m
LEFT JOIN member_role mr ON m.id = mr.member_id AND mr.is_active = TRUE
LEFT JOIN role r ON mr.role_id = r.id
WHERE m.id = 1;
