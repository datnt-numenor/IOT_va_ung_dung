require("dotenv").config();

const mysql = require("mysql2/promise");

// Thiết bị và cảm biến giờ dùng chung các topic MQTT cố định (lấy từ biến môi trường),
// nên các cột topic riêng trong database không còn cần thiết.
const COLUMNS = {
  devices: ["command_topic", "status_topic"],
  sensors: ["mqtt_topic"],
};

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    for (const [table, columns] of Object.entries(COLUMNS)) {
      for (const column of columns) {
        const [[found]] = await connection.execute(
          `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [table, column],
        );
        if (Number(found.total) === 0) {
          console.log(`${table}.${column} already removed`);
          continue;
        }
        await connection.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
        console.log(`${table}.${column} dropped`);
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
