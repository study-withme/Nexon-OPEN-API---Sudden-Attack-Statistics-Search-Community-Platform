-- 역할 기반 권한 시스템

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

-- 회원-역할 매핑 (기존 member_role 테이블과 통합)
-- 기존 member_role 테이블이 있으므로 컬럼 추가
ALTER TABLE member_role 
  ADD COLUMN IF NOT EXISTS role_id BIGINT NULL COMMENT '역할 ID',
  ADD COLUMN IF NOT EXISTS revoked_by BIGINT NULL COMMENT '권한 회수한 관리자 ID',
  ADD CONSTRAINT fk_mr_role_id FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_mr_revoked_by FOREIGN KEY (revoked_by) REFERENCES member(id) ON DELETE SET NULL;

-- 기본 역할 데이터 삽입
INSERT INTO role (name, display_name, description) VALUES
('ADMIN', '최고 관리자', '모든 권한을 가진 최고 관리자'),
('MODERATOR', '모더레이터', '콘텐츠 관리 권한을 가진 모더레이터'),
('USER', '일반 사용자', '기본 사용자 권한');

-- 기본 권한 데이터 삽입
INSERT INTO permission (resource, action, description) VALUES
-- 회원 관리
('USER', 'READ', '회원 조회'),
('USER', 'WRITE', '회원 정보 수정'),
('USER', 'DELETE', '회원 삭제'),
('USER', 'SUSPEND', '회원 정지'),
('USER', 'RELEASE', '회원 해제'),
-- 게시글 관리
('POST', 'READ', '게시글 조회'),
('POST', 'WRITE', '게시글 작성/수정'),
('POST', 'DELETE', '게시글 삭제'),
('POST', 'HIDE', '게시글 숨김'),
-- 댓글 관리
('COMMENT', 'READ', '댓글 조회'),
('COMMENT', 'WRITE', '댓글 작성/수정'),
('COMMENT', 'DELETE', '댓글 삭제'),
-- 신고 관리
('REPORT', 'READ', '신고 조회'),
('REPORT', 'PROCESS', '신고 처리'),
-- 병영신고 관리
('BARRACKS_REPORT', 'READ', '병영신고 조회'),
('BARRACKS_REPORT', 'PROCESS', '병영신고 처리'),
-- 클랜 관리
('CLAN', 'READ', '클랜 조회'),
('CLAN', 'WRITE', '클랜 정보 수정'),
('CLAN', 'DELETE', '클랜 삭제'),
-- 시스템 설정
('SYSTEM', 'READ', '시스템 설정 조회'),
('SYSTEM', 'WRITE', '시스템 설정 수정'),
-- 로그
('LOG', 'READ', '로그 조회'),
-- 통계
('ANALYTICS', 'READ', '통계 조회');

-- 관리자 역할에 모든 권한 부여
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.name = 'ADMIN';

-- 모더레이터 역할에 콘텐츠 관리 권한 부여
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.name = 'MODERATOR'
AND p.resource IN ('POST', 'COMMENT', 'REPORT', 'BARRACKS_REPORT')
AND p.action IN ('READ', 'DELETE', 'HIDE', 'PROCESS');

-- 회원 정지 이력 테이블
CREATE TABLE IF NOT EXISTS member_suspension (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  suspended_by BIGINT NOT NULL,
  suspended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT 'NULL이면 영구 정지',
  released_at TIMESTAMP NULL,
  released_by BIGINT NULL,
  CONSTRAINT fk_ms_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_suspended_by FOREIGN KEY (suspended_by) REFERENCES member(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ms_released_by FOREIGN KEY (released_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_ms_member (member_id, suspended_at DESC),
  INDEX idx_ms_active (member_id, expires_at, released_at)
) COMMENT='회원 정지 이력';

-- 회원 등급 이력 테이블
CREATE TABLE IF NOT EXISTS member_grade_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  old_grade VARCHAR(50),
  new_grade VARCHAR(50) NOT NULL,
  changed_by BIGINT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mgh_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_mgh_changed_by FOREIGN KEY (changed_by) REFERENCES member(id) ON DELETE RESTRICT,
  INDEX idx_mgh_member (member_id, changed_at DESC)
) COMMENT='회원 등급 이력';

-- 관리자 활동 로그 (기존 admin_action_log와 통합, 컬럼 추가)
ALTER TABLE admin_action_log
  ADD COLUMN IF NOT EXISTS action_result VARCHAR(50) NULL COMMENT '작업 결과 (SUCCESS, FAILED)',
  ADD COLUMN IF NOT EXISTS error_message TEXT NULL COMMENT '에러 메시지';
