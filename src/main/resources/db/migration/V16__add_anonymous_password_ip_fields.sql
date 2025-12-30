-- 비로그인 익명 게시글/댓글을 위한 필드 추가
-- 비밀번호 해시, IP 주소, author_id nullable 처리

-- 게시글 테이블에 필드 추가
SET @col_exists_password = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND column_name = 'password_hash');

SET @sql_post_password = IF(@col_exists_password = 0,
    'ALTER TABLE post ADD COLUMN password_hash VARCHAR(255) NULL COMMENT ''비로그인 게시글 비밀번호 해시'';',
    'SELECT 1');

PREPARE stmt_post_password FROM @sql_post_password;
EXECUTE stmt_post_password;
DEALLOCATE PREPARE stmt_post_password;

SET @col_exists_ip = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND column_name = 'author_ip');

SET @sql_post_ip = IF(@col_exists_ip = 0,
    'ALTER TABLE post ADD COLUMN author_ip VARCHAR(64) NULL COMMENT ''작성자 IP 주소'';',
    'SELECT 1');

PREPARE stmt_post_ip FROM @sql_post_ip;
EXECUTE stmt_post_ip;
DEALLOCATE PREPARE stmt_post_ip;

-- author_id를 nullable로 변경 (비로그인 사용자 허용)
SET @col_exists_author = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND column_name = 'author_id');

SET @sql_post_author = IF(@col_exists_author > 0,
    'ALTER TABLE post MODIFY COLUMN author_id BIGINT NULL COMMENT ''작성자 ID (NULL인 경우 비로그인 사용자)'';',
    'SELECT 1');

PREPARE stmt_post_author FROM @sql_post_author;
EXECUTE stmt_post_author;
DEALLOCATE PREPARE stmt_post_author;

-- 댓글 테이블에 필드 추가
SET @col_exists_comment_password = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND column_name = 'password_hash');

SET @sql_comment_password = IF(@col_exists_comment_password = 0,
    'ALTER TABLE comment ADD COLUMN password_hash VARCHAR(255) NULL COMMENT ''비로그인 댓글 비밀번호 해시'';',
    'SELECT 1');

PREPARE stmt_comment_password FROM @sql_comment_password;
EXECUTE stmt_comment_password;
DEALLOCATE PREPARE stmt_comment_password;

SET @col_exists_comment_ip = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND column_name = 'author_ip');

SET @sql_comment_ip = IF(@col_exists_comment_ip = 0,
    'ALTER TABLE comment ADD COLUMN author_ip VARCHAR(64) NULL COMMENT ''작성자 IP 주소'';',
    'SELECT 1');

PREPARE stmt_comment_ip FROM @sql_comment_ip;
EXECUTE stmt_comment_ip;
DEALLOCATE PREPARE stmt_comment_ip;

-- comment의 author_id를 nullable로 변경
SET @col_exists_comment_author = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND column_name = 'author_id');

SET @sql_comment_author = IF(@col_exists_comment_author > 0,
    'ALTER TABLE comment MODIFY COLUMN author_id BIGINT NULL COMMENT ''작성자 ID (NULL인 경우 비로그인 사용자)'';',
    'SELECT 1');

PREPARE stmt_comment_author FROM @sql_comment_author;
EXECUTE stmt_comment_author;
DEALLOCATE PREPARE stmt_comment_author;

-- 인덱스 추가 (IP 주소 조회용)
SET @idx_exists_post_ip = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND index_name = 'idx_post_author_ip');

SET @sql_idx_post_ip = IF(@idx_exists_post_ip = 0,
    'CREATE INDEX idx_post_author_ip ON post(author_ip, created_at DESC);',
    'SELECT 1');

PREPARE stmt_idx_post_ip FROM @sql_idx_post_ip;
EXECUTE stmt_idx_post_ip;
DEALLOCATE PREPARE stmt_idx_post_ip;

SET @idx_exists_comment_ip = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND index_name = 'idx_comment_author_ip');

SET @sql_idx_comment_ip = IF(@idx_exists_comment_ip = 0,
    'CREATE INDEX idx_comment_author_ip ON comment(author_ip, created_at DESC);',
    'SELECT 1');

PREPARE stmt_idx_comment_ip FROM @sql_idx_comment_ip;
EXECUTE stmt_idx_comment_ip;
DEALLOCATE PREPARE stmt_idx_comment_ip;
