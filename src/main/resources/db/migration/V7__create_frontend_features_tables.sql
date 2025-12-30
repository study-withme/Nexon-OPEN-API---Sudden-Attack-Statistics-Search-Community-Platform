-- Frontend and community feature tables
-- Community posts, comments, barracks reports, clans, market, admin, etc.

-- ============================================
-- 1. Community post related tables
-- ============================================

CREATE TABLE IF NOT EXISTS post (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT NOT NULL,
  category VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  is_notice BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
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
) COMMENT='community post';

CREATE TABLE IF NOT EXISTS comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
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
) COMMENT='post comment';

CREATE TABLE IF NOT EXISTS post_attachment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  attachment_type VARCHAR(32) NOT NULL,
  file_path VARCHAR(512),
  file_url VARCHAR(1024),
  file_name VARCHAR(255),
  file_size BIGINT,
  thumbnail_url VARCHAR(1024),
  display_order INT DEFAULT 0,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachment_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  INDEX idx_attachment_post (post_id, display_order),
  INDEX idx_attachment_type (attachment_type)
) COMMENT='post attachment';

CREATE TABLE IF NOT EXISTS post_like (
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, member_id),
  CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_like_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_post_like_member (member_id, created_at DESC)
) COMMENT='post like';

CREATE TABLE IF NOT EXISTS comment_like (
  comment_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, member_id),
  CONSTRAINT fk_comment_like_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_like_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_comment_like_member (member_id, created_at DESC)
) COMMENT='comment like';

-- ============================================
-- 2. Barracks report related tables
-- ============================================

CREATE TABLE IF NOT EXISTS barracks_report (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT NOT NULL,
  target_nickname VARCHAR(64) NOT NULL,
  target_ouid VARCHAR(64) NULL,
  barracks_address VARCHAR(255) NOT NULL,
  report_type VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  report_count INT DEFAULT 1,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) DEFAULT 'pending',
  admin_notes TEXT,
  processed_by BIGINT NULL,
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
) COMMENT='barracks report';

CREATE TABLE IF NOT EXISTS barracks_report_attachment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  report_id BIGINT NOT NULL,
  attachment_type VARCHAR(32) NOT NULL,
  file_path VARCHAR(512),
  file_url VARCHAR(1024),
  file_name VARCHAR(255),
  file_size BIGINT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_barracks_attachment_report FOREIGN KEY (report_id) REFERENCES barracks_report(id) ON DELETE CASCADE,
  INDEX idx_barracks_attachment_report (report_id, display_order)
) COMMENT='barracks report attachment';

-- ============================================
-- 3. Clan related tables
-- ============================================

CREATE TABLE IF NOT EXISTS clan (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  clan_name VARCHAR(128) NOT NULL UNIQUE,
  barracks_address VARCHAR(255) NOT NULL UNIQUE,
  master_id BIGINT NOT NULL,
  description TEXT,
  contact VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by BIGINT NULL,
  verified_at TIMESTAMP NULL,
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason TEXT,
  member_count INT DEFAULT 0,
  status VARCHAR(32) DEFAULT 'active',
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
) COMMENT='clan';

CREATE TABLE IF NOT EXISTS clan_member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  clan_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  role VARCHAR(32) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  CONSTRAINT fk_clan_member_clan FOREIGN KEY (clan_id) REFERENCES clan(id) ON DELETE CASCADE,
  CONSTRAINT fk_clan_member_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_clan_member_clan (clan_id, is_active, joined_at DESC),
  INDEX idx_clan_member_member (member_id, is_active)
) COMMENT='clan member';

CREATE TABLE IF NOT EXISTS clan_verification_request (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  clan_id BIGINT NOT NULL,
  requested_by BIGINT NOT NULL,
  verification_data TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  admin_notes TEXT,
  processed_by BIGINT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clan_verification_clan FOREIGN KEY (clan_id) REFERENCES clan(id) ON DELETE CASCADE,
  CONSTRAINT fk_clan_verification_requested_by FOREIGN KEY (requested_by) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_clan_verification_processed_by FOREIGN KEY (processed_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_clan_verification_clan (clan_id, status, created_at DESC),
  INDEX idx_clan_verification_status (status, created_at DESC)
) COMMENT='clan verification request';

CREATE TABLE IF NOT EXISTS clan_delete_request (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  clan_id BIGINT NOT NULL,
  requested_by BIGINT NOT NULL,
  reason TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  processed_by BIGINT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clan_delete_clan FOREIGN KEY (clan_id) REFERENCES clan(id) ON DELETE CASCADE,
  CONSTRAINT fk_clan_delete_requested_by FOREIGN KEY (requested_by) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_clan_delete_processed_by FOREIGN KEY (processed_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_clan_delete_clan (clan_id, status, created_at DESC)
) COMMENT='clan delete request';

CREATE TABLE IF NOT EXISTS suspicious_clan (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  clan_id BIGINT NULL,
  clan_name VARCHAR(128) NOT NULL,
  barracks_address VARCHAR(255) NOT NULL,
  reported_by BIGINT NOT NULL,
  reason TEXT NOT NULL,
  evidence_url VARCHAR(512),
  status VARCHAR(32) DEFAULT 'pending',
  confirmed_by BIGINT NULL,
  confirmed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_suspicious_clan_id FOREIGN KEY (clan_id) REFERENCES clan(id) ON DELETE SET NULL,
  CONSTRAINT fk_suspicious_clan_reporter FOREIGN KEY (reported_by) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_suspicious_clan_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_suspicious_clan_name (clan_name),
  INDEX idx_suspicious_clan_status (status, created_at DESC)
) COMMENT='suspicious clan';

-- ============================================
-- 4. Market related tables
-- ============================================

CREATE TABLE IF NOT EXISTS market_item (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT NOT NULL,
  category VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15, 2) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(32) DEFAULT 'available',
  views INT DEFAULT 0,
  is_negotiable BOOLEAN DEFAULT FALSE,
  contact_method VARCHAR(32),
  contact_info VARCHAR(255),
  sold_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_market_item_seller FOREIGN KEY (seller_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_market_item_seller (seller_id, created_at DESC),
  INDEX idx_market_item_category (category, created_at DESC),
  INDEX idx_market_item_status (status, created_at DESC),
  INDEX idx_market_item_price (price),
  INDEX idx_market_item_views (views DESC)
) COMMENT='market item';

CREATE TABLE IF NOT EXISTS market_item_image (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  item_id BIGINT NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  image_path VARCHAR(512),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_market_image_item FOREIGN KEY (item_id) REFERENCES market_item(id) ON DELETE CASCADE,
  INDEX idx_market_image_item (item_id, display_order)
) COMMENT='market item image';

-- ============================================
-- 5. Member role and admin related tables
-- ============================================

CREATE TABLE IF NOT EXISTS member_role (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  role VARCHAR(32) NOT NULL,
  granted_by BIGINT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_member_role_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_member_role_granted_by FOREIGN KEY (granted_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_member_role_member (member_id, is_active),
  INDEX idx_member_role_role (role, is_active)
) COMMENT='member role';

CREATE TABLE IF NOT EXISTS admin_action_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT NOT NULL,
  action_type VARCHAR(64) NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT NULL,
  action_data TEXT,
  ip_address VARCHAR(64),
  user_agent VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_log_admin FOREIGN KEY (admin_id) REFERENCES member(id) ON DELETE RESTRICT,
  INDEX idx_admin_log_admin (admin_id, created_at DESC),
  INDEX idx_admin_log_target (target_type, target_id),
  INDEX idx_admin_log_type (action_type, created_at DESC),
  INDEX idx_admin_log_date (created_at DESC)
) COMMENT='admin action log';

-- ============================================
-- 6. Utility tables
-- ============================================

CREATE TABLE IF NOT EXISTS member_follow (
  follower_id BIGINT NOT NULL,
  following_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_follow_following FOREIGN KEY (following_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_follow_follower (follower_id, created_at DESC),
  INDEX idx_follow_following (following_id, created_at DESC)
) COMMENT='member follow';

CREATE TABLE IF NOT EXISTS notification (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  sender_id BIGINT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  target_type VARCHAR(32) NULL,
  target_id BIGINT NULL,
  link_url VARCHAR(512),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_recipient (recipient_id, created_at DESC),
  INDEX idx_notification_target (target_type, target_id),
  INDEX idx_notification_unread (recipient_id, is_read, created_at DESC)
) COMMENT='notification';

CREATE TABLE IF NOT EXISTS content_report (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  reporter_id BIGINT NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  report_reason VARCHAR(64) NOT NULL,
  description TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  processed_by BIGINT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_content_report_reporter FOREIGN KEY (reporter_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_report_processed_by FOREIGN KEY (processed_by) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_content_report_target (target_type, target_id, created_at DESC),
  INDEX idx_content_report_reporter (reporter_id, created_at DESC),
  INDEX idx_content_report_status (status, created_at DESC)
) COMMENT='content report';

CREATE TABLE IF NOT EXISTS member_block (
  blocker_id BIGINT NOT NULL,
  blocked_id BIGINT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_block_blocker (blocker_id, created_at DESC),
  INDEX idx_block_blocked (blocked_id)
) COMMENT='member block';

CREATE TABLE IF NOT EXISTS bookmark (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmark_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_bookmark_member (member_id, created_at DESC),
  INDEX idx_bookmark_target (target_type, target_id)
) COMMENT='bookmark';

CREATE TABLE IF NOT EXISTS post_draft (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT NOT NULL,
  category VARCHAR(32) NULL,
  title VARCHAR(255),
  content TEXT,
  attachments_data TEXT,
  auto_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_draft_author FOREIGN KEY (author_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_draft_author (author_id, auto_saved_at DESC)
) COMMENT='post draft';

CREATE TABLE IF NOT EXISTS member_preference (
  member_id BIGINT NOT NULL PRIMARY KEY,
  email_notification BOOLEAN DEFAULT TRUE,
  push_notification BOOLEAN DEFAULT TRUE,
  comment_notification BOOLEAN DEFAULT TRUE,
  like_notification BOOLEAN DEFAULT TRUE,
  follow_notification BOOLEAN DEFAULT TRUE,
  theme VARCHAR(32) DEFAULT 'dark',
  language VARCHAR(8) DEFAULT 'ko',
  privacy_level VARCHAR(32) DEFAULT 'public',
  custom_settings TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preference_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
) COMMENT='member preference';

CREATE TABLE IF NOT EXISTS email_verification (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NULL,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(64) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_verification_code (verification_code, expires_at),
  INDEX idx_email_verification_email (email, purpose, is_verified)
) COMMENT='email verification';

CREATE TABLE IF NOT EXISTS login_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  user_agent VARCHAR(512),
  device_info VARCHAR(255),
  location VARCHAR(255),
  login_type VARCHAR(32) DEFAULT 'password',
  is_successful BOOLEAN DEFAULT TRUE,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_login_history_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_login_history_member (member_id, created_at DESC),
  INDEX idx_login_history_ip (ip_address, created_at DESC)
) COMMENT='login history';

CREATE TABLE IF NOT EXISTS password_change_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  changed_by_ip VARCHAR(64),
  changed_by_user_agent VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_history_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_password_history_member (member_id, created_at DESC)
) COMMENT='password change history';

CREATE TABLE IF NOT EXISTS tag (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  slug VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tag_name (name),
  INDEX idx_tag_slug (slug),
  INDEX idx_tag_usage (usage_count DESC)
) COMMENT='tag';

CREATE TABLE IF NOT EXISTS post_tag (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tag_tag FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
  INDEX idx_post_tag_post (post_id),
  INDEX idx_post_tag_tag (tag_id)
) COMMENT='post tag';

CREATE TABLE IF NOT EXISTS search_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NULL,
  ip_address VARCHAR(64),
  search_type VARCHAR(32) NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  filters TEXT,
  result_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_search_history_member (member_id, created_at DESC),
  INDEX idx_search_history_keyword (keyword, created_at DESC),
  INDEX idx_search_history_type (search_type, created_at DESC)
) COMMENT='search history';

CREATE TABLE IF NOT EXISTS file_storage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(512) NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(128),
  file_hash VARCHAR(64),
  uploader_id BIGINT NULL,
  reference_count INT DEFAULT 1,
  is_temporary BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_file_storage_uploader FOREIGN KEY (uploader_id) REFERENCES member(id) ON DELETE SET NULL,
  INDEX idx_file_storage_path (file_path),
  INDEX idx_file_storage_hash (file_hash),
  INDEX idx_file_storage_temporary (is_temporary, expires_at)
) COMMENT='file storage';

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NULL,
  activity_type VARCHAR(64) NOT NULL,
  target_type VARCHAR(32) NULL,
  target_id BIGINT NULL,
  metadata TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_log_member (member_id, created_at DESC),
  INDEX idx_activity_log_type (activity_type, created_at DESC),
  INDEX idx_activity_log_target (target_type, target_id)
) COMMENT='activity log';

CREATE TABLE IF NOT EXISTS message (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sender_id BIGINT NOT NULL,
  recipient_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_recipient BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES member(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_recipient FOREIGN KEY (recipient_id) REFERENCES member(id) ON DELETE CASCADE,
  INDEX idx_message_sender (sender_id, is_deleted_by_sender, created_at DESC),
  INDEX idx_message_recipient (recipient_id, is_deleted_by_recipient, is_read, created_at DESC),
  INDEX idx_message_unread (recipient_id, is_read, created_at DESC)
) COMMENT='message';

CREATE TABLE IF NOT EXISTS message_attachment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  message_id BIGINT NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  file_name VARCHAR(255),
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_attachment_message FOREIGN KEY (message_id) REFERENCES message(id) ON DELETE CASCADE,
  INDEX idx_message_attachment_message (message_id)
) COMMENT='message attachment';
