-- 병영신고 테이블에 정지 상태 관련 필드 추가
ALTER TABLE barracks_report
ADD COLUMN ban_status VARCHAR(32) DEFAULT NULL COMMENT '정지 상태: null=미확인, active=활동중, temporary=임시정지, permanent=영구정지',
ADD COLUMN ban_checked_at DATETIME DEFAULT NULL COMMENT '정지 상태 확인 일시',
ADD COLUMN total_report_count INT DEFAULT 1 COMMENT '해당 닉네임에 대한 전체 제보 건수';

-- 인덱스 추가
CREATE INDEX idx_barracks_report_ban_status ON barracks_report(ban_status);
CREATE INDEX idx_barracks_report_total_count ON barracks_report(total_report_count);

-- 기존 데이터의 total_report_count 업데이트
UPDATE barracks_report br
SET total_report_count = (
    SELECT COUNT(*) 
    FROM barracks_report 
    WHERE target_nickname = br.target_nickname 
    AND is_deleted = false
    AND report_type != 'troll'
);

