-- Member 테이블에 로그인 이력 필드 추가
-- 실제 DB 스키마와 동기화
-- MariaDB는 IF NOT EXISTS를 지원하지 않으므로 information_schema로 확인 후 추가

-- Nexon 연동 관련 컬럼 추가 (없는 경우에만)
SET @ouid_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'ouid');

SET @clan_name_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'clan_name');

SET @title_name_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'title_name');

SET @manner_grade_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'manner_grade');

SET @nexon_linked_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'nexon_linked');

SET @last_login_ip_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'last_login_ip');

SET @last_login_at_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'last_login_at');

-- 컬럼 추가 (없는 경우에만)
SET @sql_ouid = IF(@ouid_exists = 0,
    'ALTER TABLE member ADD COLUMN ouid VARCHAR(64) DEFAULT NULL COMMENT ''Nexon OUID''',
    'SELECT 1');

SET @sql_clan_name = IF(@clan_name_exists = 0,
    'ALTER TABLE member ADD COLUMN clan_name VARCHAR(128) DEFAULT NULL COMMENT ''클랜명''',
    'SELECT 1');

SET @sql_title_name = IF(@title_name_exists = 0,
    'ALTER TABLE member ADD COLUMN title_name VARCHAR(128) DEFAULT NULL COMMENT ''칭호명''',
    'SELECT 1');

SET @sql_manner_grade = IF(@manner_grade_exists = 0,
    'ALTER TABLE member ADD COLUMN manner_grade VARCHAR(32) DEFAULT NULL COMMENT ''매너 등급''',
    'SELECT 1');

SET @sql_nexon_linked = IF(@nexon_linked_exists = 0,
    'ALTER TABLE member ADD COLUMN nexon_linked TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Nexon 연동 여부''',
    'SELECT 1');

SET @sql_last_login_ip = IF(@last_login_ip_exists = 0,
    'ALTER TABLE member ADD COLUMN last_login_ip VARCHAR(64) DEFAULT NULL COMMENT ''마지막 로그인 IP 주소''',
    'SELECT 1');

SET @sql_last_login_at = IF(@last_login_at_exists = 0,
    'ALTER TABLE member ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL COMMENT ''마지막 로그인 시간''',
    'SELECT 1');

PREPARE stmt_ouid FROM @sql_ouid;
EXECUTE stmt_ouid;
DEALLOCATE PREPARE stmt_ouid;

PREPARE stmt_clan_name FROM @sql_clan_name;
EXECUTE stmt_clan_name;
DEALLOCATE PREPARE stmt_clan_name;

PREPARE stmt_title_name FROM @sql_title_name;
EXECUTE stmt_title_name;
DEALLOCATE PREPARE stmt_title_name;

PREPARE stmt_manner_grade FROM @sql_manner_grade;
EXECUTE stmt_manner_grade;
DEALLOCATE PREPARE stmt_manner_grade;

PREPARE stmt_nexon_linked FROM @sql_nexon_linked;
EXECUTE stmt_nexon_linked;
DEALLOCATE PREPARE stmt_nexon_linked;

PREPARE stmt_last_login_ip FROM @sql_last_login_ip;
EXECUTE stmt_last_login_ip;
DEALLOCATE PREPARE stmt_last_login_ip;

PREPARE stmt_last_login_at FROM @sql_last_login_at;
EXECUTE stmt_last_login_at;
DEALLOCATE PREPARE stmt_last_login_at;

-- 인덱스 추가 (로그인 이력 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_member_last_login_at ON member(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_nexon_linked ON member(nexon_linked);

