-- V4부터 V15까지 수동 마이그레이션 실행 스크립트
-- 클라우드타입 MariaDB 터미널에서 실행하세요
-- 주의: V1, V2, V3는 이미 실행되었으므로 V4부터 시작합니다

USE jokercommunity;

-- ============================================
-- V4: Tier Grade 테이블 생성 (수정된 버전)
-- ============================================

-- 티어 및 계급 정보 저장 테이블
CREATE TABLE IF NOT EXISTS tier_grade (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  label VARCHAR(64) NOT NULL,
  type VARCHAR(32),
  category VARCHAR(32),
  image_path VARCHAR(128),
  color VARCHAR(32),
  min_score INT,
  max_score INT,
  min_ranking INT,
  max_ranking INT
);

-- 서든어택 티어 정보 초기 데이터 삽입 (수정된 버전 - 10개 컬럼 모두 포함)
INSERT INTO tier_grade (code, label, type, category, image_path, color, min_score, max_score, min_ranking, max_ranking) VALUES
-- 실버 티어
('SILVER I', '실버 I', 'TIER', 'SOLO', '/tiers/silver.svg', 'text-gray-400', 600, 799, NULL, NULL),
('SILVER II', '실버 II', 'TIER', 'SOLO', '/tiers/silver.svg', 'text-gray-400', 800, 999, NULL, NULL),
('SILVER III', '실버 III', 'TIER', 'SOLO', '/tiers/silver.svg', 'text-gray-400', 1000, 1199, NULL, NULL),
-- 골드 티어
('GOLD I', '골드 I', 'TIER', 'SOLO', '/tiers/gold.svg', 'text-yellow-400', 1200, 1399, NULL, NULL),
('GOLD II', '골드 II', 'TIER', 'SOLO', '/tiers/gold.svg', 'text-yellow-400', 1400, 1599, NULL, NULL),
('GOLD III', '골드 III', 'TIER', 'SOLO', '/tiers/gold.svg', 'text-yellow-400', 1600, 1799, NULL, NULL),
-- 마스터 티어
('MASTER I', '마스터 I', 'TIER', 'SOLO', '/tiers/platinum.svg', 'text-blue-400', 1800, 1999, NULL, NULL),
('MASTER II', '마스터 II', 'TIER', 'SOLO', '/tiers/platinum.svg', 'text-blue-400', 2000, 2199, NULL, NULL),
('MASTER III', '마스터 III', 'TIER', 'SOLO', '/tiers/platinum.svg', 'text-blue-400', 2200, 2399, NULL, NULL),
-- 그랜드마스터 티어
('GRAND MASTER I', '그랜드마스터 I', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-purple-400', 2400, 2599, NULL, NULL),
('GRAND MASTER II', '그랜드마스터 II', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-purple-400', 2600, 2799, NULL, NULL),
('GRAND MASTER III', '그랜드마스터 III', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-purple-400', 2800, 2999, NULL, NULL),
-- 레전드
('LEGEND', '레전드', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-yellow-300', 3000, NULL, NULL, NULL),
-- 랭커
('RANKER', 'RANKER', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-emerald-400', NULL, NULL, 101, 300),
('HIGH RANKER', 'HIGH RANKER', 'TIER', 'SOLO', '/tiers/gm.svg', 'text-yellow-300', NULL, NULL, 1, 100),
-- 계급 (서든어택 계급표)
('특급대장', '특급대장', 'GRADE', 'INTEGRATED', '/tiers/gm.svg', 'text-purple-400', NULL, NULL, NULL, NULL),
('대장', '대장', 'GRADE', 'INTEGRATED', '/tiers/platinum.svg', 'text-blue-400', NULL, NULL, NULL, NULL),
('중장', '중장', 'GRADE', 'INTEGRATED', '/tiers/platinum.svg', 'text-blue-400', NULL, NULL, NULL, NULL),
('소장', '소장', 'GRADE', 'INTEGRATED', '/tiers/gold.svg', 'text-yellow-400', NULL, NULL, NULL, NULL),
('준장', '준장', 'GRADE', 'INTEGRATED', '/tiers/gold.svg', 'text-yellow-400', NULL, NULL, NULL, NULL),
('대위', '대위', 'GRADE', 'INTEGRATED', '/tiers/silver.svg', 'text-gray-400', NULL, NULL, NULL, NULL),
('중위', '중위', 'GRADE', 'INTEGRATED', '/tiers/silver.svg', 'text-gray-400', NULL, NULL, NULL, NULL),
('소위', '소위', 'GRADE', 'INTEGRATED', '/tiers/silver.svg', 'text-gray-400', NULL, NULL, NULL, NULL),
('상사', '상사', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('중사', '중사', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('하사', '하사', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('병장', '병장', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('상병', '상병', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('일병', '일병', 'GRADE', 'INTEGRATED', '/tiers/bronze.svg', 'text-orange-400', NULL, NULL, NULL, NULL),
('이병', '이병', 'GRADE', 'INTEGRATED', '/tiers/unranked.svg', 'text-slate-400', NULL, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE code=code;

-- ============================================
-- V5: 성능 인덱스 추가
-- ============================================

CREATE INDEX IF NOT EXISTS idx_player_rank_updated ON player_rank(updated_at);
CREATE INDEX IF NOT EXISTS idx_match_player_ouid_date ON match_player(ouid, match_id);
CREATE INDEX IF NOT EXISTS idx_match_meta_date_desc ON match_meta(date_match_utc DESC);
CREATE INDEX IF NOT EXISTS idx_tier_grade_code ON tier_grade(code);
CREATE INDEX IF NOT EXISTS idx_tier_grade_type_category ON tier_grade(type, category);

-- ============================================
-- V6: 추가 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_player_rank_updated_at ON player_rank(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_player_user_name ON match_player(user_name);
CREATE INDEX IF NOT EXISTS idx_player_updated_at ON player(updated_at DESC);

-- ============================================
-- V7: 프론트엔드 기능 테이블 (일부만 - 전체는 너무 길어서)
-- ============================================
-- 주의: V7은 매우 긴 파일이므로, 필요한 테이블만 생성하거나
-- 전체 파일을 별도로 실행해야 합니다.

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS post (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT NOT NULL,
  category VARCHAR(32) NOT NULL COMMENT 'notice, free, popular, ranked, custom, supply, duo',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL COMMENT 'HTML 형식의 게시글 내용',
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  is_notice BOOLEAN DEFAULT FALSE COMMENT '공지 여부',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '상단 고정 여부',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부 (soft delete)',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_post_category (category, created_at DESC),
  INDEX idx_post_author (author_id, created_at DESC),
  INDEX idx_post_notice (is_notice, is_pinned, created_at DESC),
  INDEX idx_post_views (views DESC),
  INDEX idx_post_likes (likes DESC),
  INDEX idx_post_deleted (is_deleted, created_at DESC)
) COMMENT='커뮤니티 게시글';

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  parent_id BIGINT NULL COMMENT '대댓글의 경우 부모 댓글 ID',
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment(id) ON DELETE CASCADE,
  INDEX idx_comment_post (post_id, created_at),
  INDEX idx_comment_author (author_id, created_at DESC),
  INDEX idx_comment_parent (parent_id, created_at),
  INDEX idx_comment_deleted (is_deleted, created_at)
) COMMENT='게시글 댓글';

-- 게시글 좋아요 테이블
CREATE TABLE IF NOT EXISTS post_like (
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, member_id),
  CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_like_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_post_like_member (member_id, created_at DESC)
) COMMENT='게시글 좋아요';

-- 댓글 좋아요 테이블
CREATE TABLE IF NOT EXISTS comment_like (
  comment_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, member_id),
  CONSTRAINT fk_comment_like_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_like_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_comment_like_member (member_id, created_at DESC)
) COMMENT='댓글 좋아요';

-- 병영신고 테이블
CREATE TABLE IF NOT EXISTS barracks_report (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT NOT NULL COMMENT '제보자 회원 ID',
  target_nickname VARCHAR(64) NOT NULL COMMENT '제보 대상 닉네임',
  target_ouid VARCHAR(64) NULL COMMENT '제보 대상 OUID (선택사항)',
  barracks_address VARCHAR(255) NOT NULL COMMENT '병영주소',
  report_type VARCHAR(32) NOT NULL COMMENT 'bad-manner, suspicious, abusing, fraud, other',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL COMMENT '제보 내용 (HTML 형식)',
  report_count INT DEFAULT 1 COMMENT '동일 대상에 대한 제보 횟수',
  is_anonymous BOOLEAN DEFAULT FALSE COMMENT '익명 제보 여부',
  status VARCHAR(32) DEFAULT 'pending' COMMENT 'pending, processing, completed, rejected',
  admin_notes TEXT COMMENT '관리자 메모',
  processed_by BIGINT NULL COMMENT '처리한 관리자 ID',
  processed_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_barracks_report_reporter FOREIGN KEY (reporter_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_barracks_report_processed_by FOREIGN KEY (processed_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_barracks_report_nickname (target_nickname),
  INDEX idx_barracks_report_ouid (target_ouid),
  INDEX idx_barracks_report_type (report_type, created_at DESC),
  INDEX idx_barracks_report_status (status, created_at DESC),
  INDEX idx_barracks_report_reporter (reporter_id, created_at DESC),
  INDEX idx_barracks_report_count (report_count DESC),
  INDEX idx_barracks_report_deleted (is_deleted, created_at DESC)
) COMMENT='병영신고';

-- 클랜 테이블
CREATE TABLE IF NOT EXISTS clan (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  clan_name VARCHAR(128) NOT NULL UNIQUE COMMENT '클랜명',
  barracks_address VARCHAR(255) NOT NULL UNIQUE COMMENT '병영주소',
  master_id BIGINT NOT NULL COMMENT '클랜 마스터 회원 ID',
  description TEXT COMMENT '클랜 설명',
  contact VARCHAR(255) COMMENT '연락처',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '검증 여부',
  verified_by BIGINT NULL COMMENT '검증한 관리자 ID',
  verified_at TIMESTAMP NULL,
  is_suspicious BOOLEAN DEFAULT FALSE COMMENT '이상탐지 여부',
  suspicious_reason TEXT COMMENT '이상탐지 사유',
  member_count INT DEFAULT 0 COMMENT '멤버 수',
  status VARCHAR(32) DEFAULT 'active' COMMENT 'active, deleted, suspended',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clan_master FOREIGN KEY (master_id) REFERENCES member(id) ON DELETE RESTRICT,
  CONSTRAINT fk_clan_verified_by FOREIGN KEY (verified_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_clan_name (clan_name),
  INDEX idx_clan_barracks (barracks_address),
  INDEX idx_clan_master (master_id),
  INDEX idx_clan_status (status, created_at DESC),
  INDEX idx_clan_verified (is_verified, verified_at DESC)
) COMMENT='클랜 정보';

-- 회원 권한 테이블
CREATE TABLE IF NOT EXISTS member_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  role VARCHAR(32) NOT NULL COMMENT 'admin, moderator, user',
  granted_by BIGINT NULL COMMENT '권한 부여한 관리자 ID',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_member_role_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_role_granted_by FOREIGN KEY (granted_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_member_role_member (member_id, is_active),
  INDEX idx_member_role_role (role, is_active)
) COMMENT='회원 권한';

-- 관리자 작업 로그 테이블
CREATE TABLE IF NOT EXISTS admin_action_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT NOT NULL COMMENT '작업한 관리자 ID',
  action_type VARCHAR(64) NOT NULL COMMENT '작업 유형',
  target_type VARCHAR(32) NOT NULL COMMENT '대상 타입 (post, comment, member, clan, report 등)',
  target_id BIGINT NULL COMMENT '대상 ID',
  action_data TEXT COMMENT '작업 내용 (JSON 형식)',
  ip_address VARCHAR(64),
  user_agent VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_log_admin FOREIGN KEY (admin_id) REFERENCES member(id) ON DELETE RESTRICT,
  INDEX idx_admin_log_admin (admin_id, created_at DESC),
  INDEX idx_admin_log_target (target_type, target_id),
  INDEX idx_admin_log_type (action_type, created_at DESC),
  INDEX idx_admin_log_date (created_at DESC)
) COMMENT='관리자 작업 로그';

-- ============================================
-- V8: 역할 권한 시스템
-- ============================================

-- 역할 테이블
CREATE TABLE IF NOT EXISTS role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL COMMENT 'ADMIN, MODERATOR, USER 등',
  display_name VARCHAR(100) NOT NULL COMMENT '표시명',
  description TEXT COMMENT '역할 설명',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_name (name)
) COMMENT='역할';

-- 권한 테이블
CREATE TABLE IF NOT EXISTS permission (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  resource VARCHAR(100) NOT NULL COMMENT 'USER, POST, REPORT 등',
  action VARCHAR(50) NOT NULL COMMENT 'READ, WRITE, DELETE 등',
  description TEXT COMMENT '권한 설명',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_resource_action (resource, action),
  INDEX idx_permission_resource (resource),
  INDEX idx_permission_action (action)
) COMMENT='권한';

-- 역할-권한 매핑
CREATE TABLE IF NOT EXISTS role_permission (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
) COMMENT='역할-권한 매핑';

-- member_role 테이블에 컬럼 추가 (MariaDB 호환)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member_role' 
    AND column_name = 'role_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE member_role ADD COLUMN role_id BIGINT NULL COMMENT ''역할 ID'', ADD COLUMN revoked_by BIGINT NULL COMMENT ''권한 회수한 관리자 ID''',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 외래 키 추가 (없는 경우에만)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'member_role' 
    AND constraint_name = 'fk_mr_role_id');

SET @sql_fk = IF(@fk_exists = 0,
    'ALTER TABLE member_role ADD CONSTRAINT fk_mr_role_id FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE, ADD CONSTRAINT fk_mr_revoked_by FOREIGN KEY (revoked_by) REFERENCES member(id) ON DELETE SET NULL',
    'SELECT 1');

PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- 기본 역할 데이터 삽입
INSERT INTO role (name, display_name, description) VALUES
('ADMIN', '최고 관리자', '모든 권한을 가진 최고 관리자'),
('MODERATOR', '모더레이터', '콘텐츠 관리 권한을 가진 모더레이터'),
('USER', '일반 사용자', '기본 사용자 권한')
ON DUPLICATE KEY UPDATE name=name;

-- 기본 권한 데이터 삽입
INSERT INTO permission (resource, action, description) VALUES
('USER', 'READ', '회원 조회'),
('USER', 'WRITE', '회원 정보 수정'),
('USER', 'DELETE', '회원 삭제'),
('USER', 'SUSPEND', '회원 정지'),
('USER', 'RELEASE', '회원 해제'),
('POST', 'READ', '게시글 조회'),
('POST', 'WRITE', '게시글 작성/수정'),
('POST', 'DELETE', '게시글 삭제'),
('POST', 'HIDE', '게시글 숨김'),
('COMMENT', 'READ', '댓글 조회'),
('COMMENT', 'WRITE', '댓글 작성/수정'),
('COMMENT', 'DELETE', '댓글 삭제'),
('REPORT', 'READ', '신고 조회'),
('REPORT', 'PROCESS', '신고 처리'),
('BARRACKS_REPORT', 'READ', '병영신고 조회'),
('BARRACKS_REPORT', 'PROCESS', '병영신고 처리'),
('CLAN', 'READ', '클랜 조회'),
('CLAN', 'WRITE', '클랜 정보 수정'),
('CLAN', 'DELETE', '클랜 삭제'),
('SYSTEM', 'READ', '시스템 설정 조회'),
('SYSTEM', 'WRITE', '시스템 설정 수정'),
('LOG', 'READ', '로그 조회'),
('ANALYTICS', 'READ', '통계 조회')
ON DUPLICATE KEY UPDATE resource=resource, action=action;

-- 관리자 역할에 모든 권한 부여
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.name = 'ADMIN'
ON DUPLICATE KEY UPDATE role_id=role_id;

-- 모더레이터 역할에 콘텐츠 관리 권한 부여
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.name = 'MODERATOR'
AND p.resource IN ('POST', 'COMMENT', 'REPORT', 'BARRACKS_REPORT')
AND p.action IN ('READ', 'DELETE', 'HIDE', 'PROCESS')
ON DUPLICATE KEY UPDATE role_id=role_id;

-- ============================================
-- V9: 관리자 접근 시도 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS admin_access_attempt (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  client_ip VARCHAR(64) NOT NULL,
  user_agent TEXT,
  request_path VARCHAR(512),
  has_auth BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_access_ip (client_ip),
  INDEX idx_admin_access_time (attempted_at)
);

-- ============================================
-- V10: 게시글/댓글 비추천 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS post_dislike (
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, member_id),
  CONSTRAINT fk_post_dislike_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_dislike_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_post_dislike_member (member_id, created_at DESC)
) COMMENT='게시글 비추천';

CREATE TABLE IF NOT EXISTS comment_dislike (
  comment_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, member_id),
  CONSTRAINT fk_comment_dislike_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_dislike_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_comment_dislike_member (member_id, created_at DESC)
) COMMENT='댓글 비추천';

-- ============================================
-- V11: 게시글 조회 기록 테이블
-- ============================================

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

-- 외래 키 추가 (없는 경우에만)
SET @fk_post_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'post_view_history' 
    AND constraint_name = 'fk_post_view_history_post');

SET @fk_member_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'post_view_history' 
    AND constraint_name = 'fk_post_view_history_member');

SET @sql_post = IF(@fk_post_exists = 0,
    'ALTER TABLE post_view_history ADD CONSTRAINT fk_post_view_history_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE',
    'SELECT 1');

PREPARE stmt_post FROM @sql_post;
EXECUTE stmt_post;
DEALLOCATE PREPARE stmt_post;

SET @sql_member = IF(@fk_member_exists = 0,
    'ALTER TABLE post_view_history ADD CONSTRAINT fk_post_view_history_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE',
    'SELECT 1');

PREPARE stmt_member FROM @sql_member;
EXECUTE stmt_member;
DEALLOCATE PREPARE stmt_member;

-- ============================================
-- V12: 병영신고 정지 상태 추가
-- ============================================

SET @col_ban_status = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'barracks_report' 
    AND column_name = 'ban_status');

SET @sql_ban = IF(@col_ban_status = 0,
    'ALTER TABLE barracks_report ADD COLUMN ban_status VARCHAR(32) DEFAULT NULL COMMENT ''정지 상태: null=미확인, active=활동중, temporary=임시정지, permanent=영구정지'', ADD COLUMN ban_checked_at DATETIME DEFAULT NULL COMMENT ''정지 상태 확인 일시'', ADD COLUMN total_report_count INT DEFAULT 1 COMMENT ''해당 닉네임에 대한 전체 제보 건수''',
    'SELECT 1');

PREPARE stmt_ban FROM @sql_ban;
EXECUTE stmt_ban;
DEALLOCATE PREPARE stmt_ban;

CREATE INDEX IF NOT EXISTS idx_barracks_report_ban_status ON barracks_report(ban_status);
CREATE INDEX IF NOT EXISTS idx_barracks_report_total_count ON barracks_report(total_report_count);

-- ============================================
-- V13: 회원 로그인 필드 추가
-- ============================================

SET @ouid_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'member' 
    AND column_name = 'ouid');

SET @sql_ouid = IF(@ouid_exists = 0,
    'ALTER TABLE member ADD COLUMN ouid VARCHAR(64) DEFAULT NULL COMMENT ''Nexon OUID'', ADD COLUMN clan_name VARCHAR(128) DEFAULT NULL COMMENT ''클랜명'', ADD COLUMN title_name VARCHAR(128) DEFAULT NULL COMMENT ''칭호명'', ADD COLUMN manner_grade VARCHAR(32) DEFAULT NULL COMMENT ''매너 등급'', ADD COLUMN nexon_linked TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Nexon 연동 여부'', ADD COLUMN last_login_ip VARCHAR(64) DEFAULT NULL COMMENT ''마지막 로그인 IP 주소'', ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL COMMENT ''마지막 로그인 시간''',
    'SELECT 1');

PREPARE stmt_ouid FROM @sql_ouid;
EXECUTE stmt_ouid;
DEALLOCATE PREPARE stmt_ouid;

CREATE INDEX IF NOT EXISTS idx_member_last_login_at ON member(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_nexon_linked ON member(nexon_linked);

-- ============================================
-- V14: 카테고리 테이블 생성
-- ============================================

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

-- ============================================
-- V15: 익명 필드 추가
-- ============================================

SET @col_post_anon = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'post' 
    AND column_name = 'is_anonymous');

SET @sql_post_anon = IF(@col_post_anon = 0,
    'ALTER TABLE post ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE COMMENT ''익명 게시글 여부''',
    'SELECT 1');

PREPARE stmt_post_anon FROM @sql_post_anon;
EXECUTE stmt_post_anon;
DEALLOCATE PREPARE stmt_post_anon;

SET @col_comment_anon = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'comment' 
    AND column_name = 'is_anonymous');

SET @sql_comment_anon = IF(@col_comment_anon = 0,
    'ALTER TABLE comment ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE COMMENT ''익명 댓글 여부''',
    'SELECT 1');

PREPARE stmt_comment_anon FROM @sql_comment_anon;
EXECUTE stmt_comment_anon;
DEALLOCATE PREPARE stmt_comment_anon;

CREATE INDEX IF NOT EXISTS idx_post_anonymous ON post(is_anonymous, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_anonymous ON comment(is_anonymous, created_at DESC);

-- ============================================
-- 완료 확인
-- ============================================

SELECT '마이그레이션 완료!' as status;
SHOW TABLES;
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'jokercommunity' 
AND table_type = 'BASE TABLE';
