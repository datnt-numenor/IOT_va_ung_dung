require("dotenv").config();

const crypto = require("crypto");
const mysql = require("mysql2/promise");
const authService = require("../services/authService");

// Thêm dữ liệu cho tính năng cảnh báo ánh sáng; chạy lại nhiều lần vẫn an toàn:
//   - bảng settings (lưu ngưỡng cảnh báo X, mặc định 500)
//   - thiết bị 4 "Đèn cảnh báo" (type warning) để LED cảnh báo xuất hiện trong lịch sử bật tắt
//   - tài khoản `system` đứng tên các lệnh bật/tắt tự động (mật khẩu ngẫu nhiên, không ai biết nên không đăng nhập được)
async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS settings (
         setting_key VARCHAR(50) PRIMARY KEY,
         setting_value VARCHAR(100) NOT NULL,
         updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
    await connection.query(
      "INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('light_alert_threshold', '500')",
    );

    await connection.query(
      `INSERT INTO devices (id, code, name, type, current_status)
       VALUES (4, 'WARN_01', 'Đèn cảnh báo', 'warning', 'OFF')
       ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type)`,
    );

    const unusablePassword = crypto.randomBytes(32).toString("hex");
    await connection.query(
      `INSERT IGNORE INTO users (username, password_hash, full_name, role)
       VALUES ('system', ?, 'Hệ thống (cảnh báo tự động)', 'viewer')`,
      [await authService.hashPassword(unusablePassword)],
    );

    const [devices] = await connection.query("SELECT id, code, name, type FROM devices ORDER BY id");
    const [settings] = await connection.query("SELECT setting_key, setting_value FROM settings");
    console.table(devices);
    console.table(settings);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
