-- 수동 실행용 SQL 스크립트
-- Flyway가 비활성화되어 있을 때 수동으로 실행하세요
-- post_view_history 테이블 구조를 정교한 추적을 위해 수정

-- 1. 테이블이 존재하는지 확인 후 구조 변경
-- 기존 NULL 데이터가 있으면 기본값으로 설정
UPDATE post_view_history 
SET member_id = 0 
WHERE member_id IS NULL;

UPDATE post_view_history 
SET ip_address = COALESCE(ip_address, '0.0.0.0')
WHERE ip_address IS NULL;

-- 2. 컬럼을 NOT NULL로 변경 (기존 데이터는 이미 처리됨)
-- 주의: 테이블이 이미 올바른 구조라면 이 구문은 에러가 발생할 수 있지만 무시해도 됩니다
ALTER TABLE post_view_history 
    MODIFY COLUMN member_id BIGINT NOT NULL COMMENT '로그인한 회원의 경우 (익명 사용자는 0)',
    MODIFY COLUMN ip_address VARCHAR(64) NOT NULL COMMENT '실제 IP 주소 (익명 사용자도 실제 IP 저장)';

-- 3. 외래 키 제약조건 추가 (없는 경우에만)
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

-- 4. 테이블이 없는 경우를 대비한 CREATE (이미 있으면 실행되지 않음)
CREATE TABLE IF NOT EXISTS post_view_history (
    post_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL COMMENT '로그인한 회원의 경우 (익명 사용자는 0)',
    ip_address VARCHAR(64) NOT NULL COMMENT '실제 IP 주소 (익명 사용자도 실제 IP 저장)',
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, member_id, ip_address),
    INDEX idx_post_view_post (post_id, viewed_at),
    INDEX idx_post_view_member (member_id, viewed_at),
    CONSTRAINT fk_post_view_history_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_view_history_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) COMMENT='게시글 조회 기록';

