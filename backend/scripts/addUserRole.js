require("dotenv").config();

const mysql = require("mysql2/promise");

// Thêm cột users.role (admin | viewer) cho phân quyền. Chạy lại nhiều lần vẫn an toàn.
// Tài khoản `admin` hiện có được đặt vai trò admin; tài khoản khác mặc định là viewer (chỉ xem).
async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [[found]] = await connection.execute(
      `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
    );
    if (Number(found.total) === 0) {
      await connection.query(
        `ALTER TABLE users
         ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'viewer' AFTER email,
         ADD CONSTRAINT chk_user_role CHECK (role IN ('admin', 'viewer'))`,
      );
      console.log("users.role added");
    } else {
      console.log("users.role already exists");
    }

    const [result] = await connection.execute("UPDATE users SET role = 'admin' WHERE username = 'admin'");
    console.log(`admin account set to role admin (${result.affectedRows} row matched)`);
    const [users] = await connection.query("SELECT id, username, role FROM users ORDER BY id");
    console.table(users);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
