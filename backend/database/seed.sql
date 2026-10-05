INSERT INTO users (id, username, password_hash, full_name, email)
VALUES (1, 'admin', SHA2('123456', 256), 'Nguyễn Tiến Đạt', NULL)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO sensors (id, code, name, type, unit, mqtt_topic) VALUES
  (1, 'TEMP_01', 'Nhiệt độ', 'temperature', '°C', 'iot/sensors/data'),
  (2, 'HUM_01', 'Độ ẩm', 'humidity', '%', 'iot/sensors/data'),
  (3, 'LIGHT_01', 'Ánh sáng', 'light', 'ADC', 'iot/sensors/data')
ON DUPLICATE KEY UPDATE name = VALUES(name), unit = VALUES(unit), mqtt_topic = VALUES(mqtt_topic);

INSERT INTO devices (id, code, name, type, current_status) VALUES
  (1, 'LIGHT_01', 'Đèn phòng', 'light', 'OFF'),
  (2, 'FAN_01', 'Quạt thông gió', 'fan', 'OFF'),
  (3, 'AC_01', 'Điều hòa', 'air_conditioner', 'OFF')
ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type);
