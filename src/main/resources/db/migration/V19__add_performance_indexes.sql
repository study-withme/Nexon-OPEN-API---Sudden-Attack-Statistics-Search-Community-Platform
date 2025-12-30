-- 성능 최적화를 위한 추가 인덱스

-- AccessLog 테이블 최적화
-- 날짜 범위 조회를 위한 복합 인덱스 (통계 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_access_log_occurred_at_desc ON access_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_created_at_desc ON access_log(created_at DESC);
-- 응답 상태별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_access_log_response_status ON access_log(response_status);
-- 경로별 조회를 위한 인덱스 (자주 조회되는 API 경로 분석용)
CREATE INDEX IF NOT EXISTS idx_access_log_request_path ON access_log(request_path(100));

-- PostViewHistory 테이블 최적화
-- 조회 히스토리 조회 최적화 (게시글 조회 중복 체크)
CREATE INDEX IF NOT EXISTS idx_post_view_history_post_member ON post_view_history(post_id, member_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_view_history_post_ip ON post_view_history(post_id, ip_address(64), viewed_at DESC);
-- 회원별 조회 히스토리 조회
CREATE INDEX IF NOT EXISTS idx_post_view_history_member ON post_view_history(member_id, viewed_at DESC);

-- Post 테이블 최적화 (추가)
-- 카테고리 + 삭제 여부 + 생성일 조회 최적화
CREATE INDEX IF NOT EXISTS idx_post_category_deleted_created ON post(category, is_deleted, created_at DESC);
-- 작성자별 게시글 수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_post_author_deleted ON post(author_id, is_deleted);
-- 인기 게시글 조회 최적화 (좋아요 수 기준)
-- MariaDB는 부분 인덱스(WHERE 절)를 지원하지 않으므로 일반 인덱스로 생성
CREATE INDEX IF NOT EXISTS idx_post_likes_desc ON post(likes DESC);

-- Comment 테이블 최적화
-- 게시글별 댓글 조회 최적화
CREATE INDEX IF NOT EXISTS idx_comment_post_deleted_created ON comment(post_id, is_deleted, created_at ASC);
-- 작성자별 댓글 수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_comment_author_deleted ON comment(author_id, is_deleted);

-- ContentReport 테이블 최적화
-- 신고 상태별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_content_report_type_status_created ON content_report(target_type, status, created_at DESC);
-- 대상별 신고 조회 최적화
CREATE INDEX IF NOT EXISTS idx_content_report_target ON content_report(target_type, target_id);
-- 신고자별 신고 수 조회
CREATE INDEX IF NOT EXISTS idx_content_report_reporter ON content_report(reporter_id);

-- SearchHistory 테이블 최적화
-- 인기 검색어 조회 최적화
CREATE INDEX IF NOT EXISTS idx_search_history_search_count_desc ON search_history(search_count DESC);
-- 검색어별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_search_history_nickname ON search_history(nickname);

-- MatchPlayer 테이블 추가 최적화
-- 통계 조회를 위한 복합 인덱스 (이미 V5, V18에서 생성되었을 수 있지만 명시적으로 추가)
-- ouid + match_id 조합 인덱스가 이미 있는지 확인 필요하지만 안전하게 IF NOT EXISTS 사용
