-- 게시글 및 댓글 비추천 테이블 생성

-- 게시글 비추천 테이블
CREATE TABLE IF NOT EXISTS post_dislike (
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, member_id),
  CONSTRAINT fk_post_dislike_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_dislike_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_post_dislike_member (member_id, created_at DESC)
) COMMENT='게시글 비추천';

-- 댓글 비추천 테이블
CREATE TABLE IF NOT EXISTS comment_dislike (
  comment_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, member_id),
  CONSTRAINT fk_comment_dislike_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_dislike_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_comment_dislike_member (member_id, created_at DESC)
) COMMENT='댓글 비추천';

