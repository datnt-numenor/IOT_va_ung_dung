INSERT INTO users (id, username, password_hash, full_name, email, role)
VALUES (1, 'admin', '$2b$10$psuIsYA7fRaWByRtS19zReuHSajy5D641VsDQCst2jELxV7.nCtPi', 'Nguyễn Tiến Đạt', NULL, 'admin')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

INSERT INTO sensors (id, code, name, type, unit) VALUES
  (1, 'TEMP_01', 'Nhiệt độ', 'temperature', '°C'),
  (2, 'HUM_01', 'Độ ẩm', 'humidity', '%'),
  (3, 'LIGHT_01', 'Ánh sáng', 'light', 'lux')
ON DUPLICATE KEY UPDATE name = VALUES(name), unit = VALUES(unit);

INSERT INTO devices (id, code, name, type, current_status) VALUES
  (1, 'LIGHT_01', 'Đèn phòng', 'light', 'OFF'),
  (2, 'FAN_01', 'Quạt thông gió', 'fan', 'OFF'),
  (3, 'AC_01', 'Điều hòa', 'air_conditioner', 'OFF'),
  (4, 'WARN_01', 'Đèn cảnh báo', 'warning', 'OFF')
ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type);

-- Tài khoản hệ thống đứng tên các lệnh bật/tắt LED cảnh báo tự động (mật khẩu ngẫu nhiên, không đăng nhập được).
INSERT IGNORE INTO users (username, password_hash, full_name, role)
VALUES ('system', '$2b$10$oSQ0hqsseTzeCSosjVOVNONu2gtZDm2sKPJhFsG5Qg.wuI/1k8Neu', 'Hệ thống (cảnh báo tự động)', 'viewer');

-- Ngưỡng cảnh báo ánh sáng X (cùng thang với giá trị ánh sáng hiển thị).
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('light_alert_threshold', '500');
