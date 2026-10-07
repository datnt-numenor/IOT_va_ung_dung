require("dotenv").config();

const mysql = require("mysql2/promise");

const COLUMNS = ["command_topic", "status_topic"];

// Các thiết bị giờ dùng chung ba topic MQTT cố định, nên các cột topic riêng của từng thiết bị không còn cần thiết.
async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    for (const column of COLUMNS) {
      const [[found]] = await connection.execute(
        `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = ?`,
        [column],
      );
      if (Number(found.total) === 0) {
        console.log(`devices.${column} already removed`);
        continue;
      }
      await connection.query(`ALTER TABLE devices DROP COLUMN \`${column}\``);
      console.log(`devices.${column} dropped`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
