require("dotenv").config();

const mysql = require("mysql2/promise");
const authService = require("../services/authService");

// Tạo tài khoản mới: node scripts/createUser.js <username> "<Họ tên>" <admin|viewer>
// Mật khẩu đọc từ biến môi trường NEW_USER_PASSWORD để không nằm trong lịch sử lệnh.
async function main() {
  const [username, fullName, role = "viewer"] = process.argv.slice(2);
  const password = process.env.NEW_USER_PASSWORD;
  if (!username || !fullName) throw new Error('Usage: node scripts/createUser.js <username> "<Full name>" <admin|viewer>');
  if (!["admin", "viewer"].includes(role)) throw new Error("role must be admin or viewer");
  if (!password || password.length < 6) throw new Error("Set NEW_USER_PASSWORD (at least 6 characters)");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.execute(
      "INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
      [username, await authService.hashPassword(password), fullName, role],
    );
    console.log(`Created user '${username}' with role ${role}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.code === "ER_DUP_ENTRY" ? "Username already exists" : error.message);
  process.exitCode = 1;
});
