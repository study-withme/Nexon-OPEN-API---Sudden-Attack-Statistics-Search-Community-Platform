-- Access log and member IP history

CREATE TABLE IF NOT EXISTS access_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  member_id BIGINT NULL,
  anonymous_id VARCHAR(64) NULL,
  is_member BOOLEAN NOT NULL DEFAULT FALSE,
  client_ip VARCHAR(64) NOT NULL,
  user_agent TEXT,
  request_path VARCHAR(512),
  http_method VARCHAR(8),
  response_status INT,
  referrer VARCHAR(512),
  trace_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_access_log_time (occurred_at),
  INDEX idx_access_log_member (member_id),
  INDEX idx_access_log_anon (anonymous_id)
);

CREATE TABLE IF NOT EXISTS member_ip_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  client_ip VARCHAR(64) NOT NULL,
  first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_member_ip (member_id, client_ip),
  INDEX idx_member_ip_member (member_id),
  CONSTRAINT fk_member_ip_member FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE CASCADE
);
