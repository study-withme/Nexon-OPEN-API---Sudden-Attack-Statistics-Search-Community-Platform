-- Post view history table for tracking post views and preventing duplicate view counting
-- 실제 DB 구조에 맞춰 복합 PRIMARY KEY 사용
-- 정교한 추적: 실제 IP 주소 저장, 회원/익명 구분
-- V7에서 이미 테이블이 생성되었을 수 있으므로 CREATE TABLE IF NOT EXISTS 사용

-- 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS post_view_history (
    post_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL COMMENT '로그인한 회원의 경우 (익명 사용자는 0)',
    ip_address VARCHAR(64) NOT NULL COMMENT '실제 IP 주소 (익명 사용자도 실제 IP 저장)',
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, member_id, ip_address),
    INDEX idx_post_view_history_post (post_id, viewed_at DESC),
    INDEX idx_post_view_history_member (member_id, viewed_at DESC),
    INDEX idx_post_view_history_ip (ip_address, viewed_at DESC),
    INDEX idx_post_view_history_time (viewed_at DESC)
) COMMENT='게시글 조회 기록 (중복 조회 방지용)';

-- 기존 테이블이 있는 경우 구조 변경 (NULL 허용 -> NOT NULL)
-- 기존 NULL 데이터가 있으면 기본값으로 설정
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post_view_history');

-- 테이블이 존재하고 데이터가 있는 경우에만 UPDATE 실행
SET @has_null_data = IF(@table_exists > 0,
    (SELECT COUNT(*) FROM post_view_history WHERE member_id IS NULL OR ip_address IS NULL),
    0);

SET @sql_update = IF(@has_null_data > 0,
    'UPDATE post_view_history SET member_id = 0 WHERE member_id IS NULL; UPDATE post_view_history SET ip_address = COALESCE(ip_address, ''0.0.0.0'') WHERE ip_address IS NULL;',
    'SELECT 1');

PREPARE stmt_update FROM @sql_update;
EXECUTE stmt_update;
DEALLOCATE PREPARE stmt_update;

-- 컬럼을 NOT NULL로 변경 (기존 데이터는 이미 처리됨)
-- 테이블이 존재하는 경우에만 ALTER 실행
SET @sql_alter = IF(@table_exists > 0,
    'ALTER TABLE post_view_history MODIFY COLUMN member_id BIGINT NOT NULL COMMENT ''로그인한 회원의 경우 (익명 사용자는 0)'', MODIFY COLUMN ip_address VARCHAR(64) NOT NULL COMMENT ''실제 IP 주소 (익명 사용자도 실제 IP 저장)'';',
    'SELECT 1');

PREPARE stmt_alter FROM @sql_alter;
EXECUTE stmt_alter;
DEALLOCATE PREPARE stmt_alter;

-- 외래 키 제약조건 추가 (없는 경우에만)
-- MySQL/MariaDB는 IF NOT EXISTS를 지원하지 않으므로 information_schema로 확인 후 추가
SET @fk_post_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'post_view_history' 
    AND constraint_name = 'fk_post_view_history_post');

SET @fk_member_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'post_view_history' 
    AND constraint_name = 'fk_post_view_history_member');

-- post_id 외래 키 추가 (없는 경우에만)
SET @sql_post = IF(@fk_post_exists = 0,
    CONCAT('ALTER TABLE post_view_history ADD CONSTRAINT fk_post_view_history_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE'),
    'SELECT 1');

PREPARE stmt_post FROM @sql_post;
EXECUTE stmt_post;
DEALLOCATE PREPARE stmt_post;

-- member_id 외래 키 추가 (없는 경우에만)
SET @sql_member = IF(@fk_member_exists = 0,
    CONCAT('ALTER TABLE post_view_history ADD CONSTRAINT fk_post_view_history_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE'),
    'SELECT 1');

PREPARE stmt_member FROM @sql_member;
EXECUTE stmt_member;
DEALLOCATE PREPARE stmt_member;

