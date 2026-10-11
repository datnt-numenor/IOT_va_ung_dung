require("dotenv").config();

const mysql = require("mysql2/promise");

const CONSTRAINT = "chk_device_status";

// FAILED chỉ là trạng thái của một hành động (action_history), không phải trạng thái vật lý của thiết bị.
// Script này đưa các thiết bị còn FAILED về trạng thái cuối được xác nhận rồi siết lại CHECK constraint.
async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [restored] = await connection.execute(
      `UPDATE devices d
       SET d.current_status = COALESCE(
         (SELECT ah.status FROM action_history ah
          WHERE ah.device_id = d.id AND ah.status IN ('ON', 'OFF')
          ORDER BY ah.id DESC LIMIT 1),
         'OFF'
       )
       WHERE d.current_status = 'FAILED'`,
    );
    console.log(`${restored.affectedRows} FAILED device(s) restored to the last confirmed status`);

    const [[existing]] = await connection.execute(
      `SELECT CHECK_CLAUSE AS clause FROM information_schema.CHECK_CONSTRAINTS
       WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ?`,
      [CONSTRAINT],
    );
    if (existing && !existing.clause.includes("FAILED")) {
      console.log(`${CONSTRAINT} already excludes FAILED`);
      return;
    }

    if (existing) await connection.query(`ALTER TABLE devices DROP CONSTRAINT ${CONSTRAINT}`);
    await connection.query(
      `ALTER TABLE devices ADD CONSTRAINT ${CONSTRAINT}
       CHECK (current_status IN ('ON', 'OFF', 'LOADING'))`,
    );
    console.log(`${CONSTRAINT} now allows only ON, OFF, LOADING`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
