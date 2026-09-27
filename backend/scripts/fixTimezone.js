require("dotenv").config();

const mysql = require("mysql2/promise");

const MIGRATION_NAME = "20260926_normalize_runtime_timestamps_to_utc";

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: "Z",
  });

  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS app_migrations (
      name VARCHAR(150) PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [[existing]] = await connection.execute(
      "SELECT name FROM app_migrations WHERE name = ?",
      [MIGRATION_NAME],
    );
    if (existing) {
      console.log(`${MIGRATION_NAME} already applied`);
      return;
    }

    await connection.query(
      "CREATE TABLE IF NOT EXISTS action_history_timezone_backup LIKE action_history",
    );
    await connection.query(
      "CREATE TABLE IF NOT EXISTS devices_timezone_backup LIKE devices",
    );

    await connection.beginTransaction();
    const [actionBackup] = await connection.query(`
      INSERT IGNORE INTO action_history_timezone_backup
      SELECT * FROM action_history
      WHERE requested_at > UTC_TIMESTAMP(3) + INTERVAL 1 HOUR
    `);
    const [deviceBackup] = await connection.query(`
      INSERT IGNORE INTO devices_timezone_backup
      SELECT * FROM devices
      WHERE updated_at > UTC_TIMESTAMP(3) + INTERVAL 1 HOUR
    `);

    await connection.query(`
      UPDATE action_history ah
      JOIN action_history_timezone_backup backup ON backup.id = ah.id
      SET ah.requested_at = DATE_SUB(backup.requested_at, INTERVAL 7 HOUR),
          ah.completed_at = CASE
            WHEN backup.completed_at IS NULL THEN NULL
            ELSE DATE_SUB(backup.completed_at, INTERVAL 7 HOUR)
          END
    `);
    await connection.query(`
      UPDATE devices d
      JOIN devices_timezone_backup backup ON backup.id = d.id
      SET d.updated_at = DATE_SUB(backup.updated_at, INTERVAL 7 HOUR)
    `);
    await connection.execute(
      "INSERT INTO app_migrations (name, applied_at) VALUES (?, UTC_TIMESTAMP(3))",
      [MIGRATION_NAME],
    );
    await connection.commit();

    console.log(`Timezone migration completed: ${actionBackup.affectedRows} actions, ${deviceBackup.affectedRows} devices backed up and corrected`);
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // The transaction may not have started yet.
    }
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
