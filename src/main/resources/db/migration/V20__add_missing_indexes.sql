-- 추가 성능 최적화 인덱스

-- Member 테이블 최적화
-- 이메일 검색 최적화 (로그인 시 사용)
CREATE INDEX IF NOT EXISTS idx_member_email ON member(email);
-- 닉네임 검색 최적화
CREATE INDEX IF NOT EXISTS idx_member_nickname ON member(nickname);
-- OUID 검색 최적화
CREATE INDEX IF NOT EXISTS idx_member_ouid ON member(ouid);

-- MemberIpHistory 테이블 최적화
-- 회원별 IP 히스토리 조회 최적화
CREATE INDEX IF NOT EXISTS idx_member_ip_history_member ON member_ip_history(member_id, last_seen_at DESC);
-- IP별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_member_ip_history_ip ON member_ip_history(client_ip(64), last_seen_at DESC);

-- AdminAccessAttempt 테이블 최적화
-- IP별 접근 시도 조회 최적화
CREATE INDEX IF NOT EXISTS idx_admin_access_attempt_ip_date ON admin_access_attempt(client_ip(64), attempted_at DESC);
-- 차단된 IP 조회 최적화
CREATE INDEX IF NOT EXISTS idx_admin_access_attempt_blocked ON admin_access_attempt(blocked, attempted_at DESC);

-- BarracksReport 테이블 최적화
-- 작성자별 제보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_barracks_report_reporter ON barracks_report(reporter_name(100), created_at DESC);
-- 상태별 제보 조회 최적화
CREATE INDEX IF NOT EXISTS idx_barracks_report_status ON barracks_report(status, created_at DESC);

-- ContentReport 테이블 최적화 (추가)
-- 게시글/댓글별 신고 조회 최적화
CREATE INDEX IF NOT EXISTS idx_content_report_target ON content_report(target_type, target_id, created_at DESC);
-- 신고자별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_content_report_reporter ON content_report(reporter_id, created_at DESC);
