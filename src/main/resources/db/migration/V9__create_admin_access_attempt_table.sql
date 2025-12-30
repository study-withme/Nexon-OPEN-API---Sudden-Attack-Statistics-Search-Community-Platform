-- Admin access attempt tracking for security

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
