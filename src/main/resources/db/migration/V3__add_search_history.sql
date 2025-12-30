-- 검색 기록 테이블 추가
CREATE TABLE IF NOT EXISTS search_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nickname VARCHAR(64) NOT NULL,
  ouid VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  search_count INT NOT NULL DEFAULT 1,
  INDEX idx_search_nickname (nickname),
  INDEX idx_search_created (created_at)
);
