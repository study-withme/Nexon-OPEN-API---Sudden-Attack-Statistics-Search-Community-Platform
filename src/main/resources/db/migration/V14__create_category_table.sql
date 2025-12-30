-- 게시판 카테고리 테이블 생성
-- 각 게시판(notice, free, popular, ranked, custom, supply, duo)의 읽기/쓰기 권한 관리

CREATE TABLE IF NOT EXISTS category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '게시판 이름: notice, free, popular, ranked, custom, supply, duo',
    description TEXT COMMENT '게시판 설명',
    display_order INT NOT NULL DEFAULT 0 COMMENT '표시 순서',
    can_write BOOLEAN DEFAULT TRUE COMMENT '글쓰기 권한 (true: 모든 사용자, false: 제한)',
    can_read BOOLEAN DEFAULT TRUE COMMENT '읽기 권한 (true: 모든 사용자, false: 제한)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_name (name),
    INDEX idx_category_display_order (display_order)
) COMMENT='게시판 카테고리';

-- 기본 카테고리 데이터 삽입
-- display_order는 프론트엔드에서 표시되는 순서를 의미
INSERT INTO category (name, description, display_order, can_write, can_read) VALUES
    ('notice', '공지사항', 1, false, true),
    ('free', '자유게시판', 2, true, true),
    ('popular', '인기글', 3, true, true),
    ('ranked', '랭크전', 4, true, true),
    ('custom', '대룰', 5, true, true),
    ('supply', '보급', 6, true, true),
    ('duo', '듀오', 7, true, true)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    display_order = VALUES(display_order),
    can_write = VALUES(can_write),
    can_read = VALUES(can_read),
    updated_at = CURRENT_TIMESTAMP;
