-- 게시글 및 댓글에 익명 기능 추가

-- 게시글 테이블에 is_anonymous 컬럼 추가 (MariaDB 호환)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND column_name = 'is_anonymous');

SET @sql_post = IF(@col_exists = 0,
    'ALTER TABLE post ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE COMMENT ''익명 게시글 여부'';',
    'SELECT 1');

PREPARE stmt_post FROM @sql_post;
EXECUTE stmt_post;
DEALLOCATE PREPARE stmt_post;

-- 댓글 테이블에 is_anonymous 컬럼 추가 (MariaDB 호환)
SET @col_exists_comment = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND column_name = 'is_anonymous');

SET @sql_comment = IF(@col_exists_comment = 0,
    'ALTER TABLE comment ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE COMMENT ''익명 댓글 여부'';',
    'SELECT 1');

PREPARE stmt_comment FROM @sql_comment;
EXECUTE stmt_comment;
DEALLOCATE PREPARE stmt_comment;

-- 인덱스 추가 (익명 게시글 조회용) - 이미 존재하면 무시
SET @idx_exists_post = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND index_name = 'idx_post_anonymous');

SET @sql_idx_post = IF(@idx_exists_post = 0,
    'CREATE INDEX idx_post_anonymous ON post(is_anonymous, created_at DESC);',
    'SELECT 1');

PREPARE stmt_idx_post FROM @sql_idx_post;
EXECUTE stmt_idx_post;
DEALLOCATE PREPARE stmt_idx_post;

-- 인덱스 추가 (익명 댓글 조회용) - 이미 존재하면 무시
SET @idx_exists_comment = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND index_name = 'idx_comment_anonymous');

SET @sql_idx_comment = IF(@idx_exists_comment = 0,
    'CREATE INDEX idx_comment_anonymous ON comment(is_anonymous, created_at DESC);',
    'SELECT 1');

PREPARE stmt_idx_comment FROM @sql_idx_comment;
EXECUTE stmt_idx_comment;
DEALLOCATE PREPARE stmt_idx_comment;
