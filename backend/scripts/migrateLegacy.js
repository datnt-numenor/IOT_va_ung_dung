require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  );
  return rows.length > 0;
}

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return rows.length > 0;
}

async function renameLegacyTable(connection, table, legacyTable, legacyColumn) {
  if (!(await tableExists(connection, table))) return;
  if (!(await columnExists(connection, table, legacyColumn))) return;
  if (await tableExists(connection, legacyTable)) {
    throw new Error(`${legacyTable} already exists; migration stopped to protect its data`);
  }
  await connection.query(`RENAME TABLE \`${table}\` TO \`${legacyTable}\``);
  console.log(`Preserved ${table} as ${legacyTable}`);
}

async function main() {
  const database = process.env.DB_NAME;
  if (!database || !/^[A-Za-z0-9_]+$/.test(database)) throw new Error("DB_NAME is missing or invalid");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    multipleStatements: true,
    timezone: "Z",
  });

  try {
    await renameLegacyTable(connection, "sensor_data", "sensor_data_legacy", "sensor");
    await renameLegacyTable(connection, "action_history", "action_history_legacy", "device");
    await renameLegacyTable(connection, "device_status", "device_status_legacy", "device");

    const schema = await fs.readFile(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
    const seed = await fs.readFile(path.join(__dirname, "..", "database", "seed.sql"), "utf8");
    await connection.query(schema);
    await connection.query(seed);

    await connection.beginTransaction();
    if (await tableExists(connection, "device_status_legacy")) {
      await connection.query(`
        UPDATE devices d JOIN device_status_legacy old
          ON BINARY d.type = BINARY CASE LOWER(old.device)
            WHEN 'light' THEN 'light'
            WHEN 'fan' THEN 'fan'
            WHEN 'ac' THEN 'air_conditioner'
          END
        SET d.current_status = old.status,
            d.updated_at = CONVERT_TZ(old.updated_at, '+07:00', '+00:00')
        WHERE old.status IN ('ON', 'OFF')
      `);
    }
    if (await tableExists(connection, "sensor_data_legacy")) {
      await connection.query(`
        INSERT INTO sensor_data (id, sensor_id, value, measured_at, created_at)
        SELECT old.id, s.id, old.value,
          CONVERT_TZ(old.time, '+07:00', '+00:00'),
          CONVERT_TZ(old.time, '+07:00', '+00:00')
        FROM sensor_data_legacy old
        JOIN sensors s ON BINARY s.type = BINARY CASE LOWER(old.sensor)
          WHEN 'temperature' THEN 'temperature'
          WHEN 'humidity' THEN 'humidity'
          WHEN 'light' THEN 'light'
        END
        ON DUPLICATE KEY UPDATE
          sensor_id = VALUES(sensor_id), value = VALUES(value),
          measured_at = VALUES(measured_at), created_at = VALUES(created_at)
      `);
    }
    if (await tableExists(connection, "action_history_legacy")) {
      await connection.query(`
        INSERT INTO action_history
          (id, user_id, device_id, action, status, requested_at, completed_at)
        SELECT old.id, 1, d.id, old.action,
          CASE WHEN old.status IN ('ON', 'OFF', 'FAILED') THEN old.status ELSE 'FAILED' END,
          CONVERT_TZ(old.time, '+07:00', '+00:00'),
          CASE WHEN old.status = 'LOADING'
            THEN DATE_ADD(CONVERT_TZ(old.time, '+07:00', '+00:00'), INTERVAL 5 SECOND)
            ELSE CONVERT_TZ(old.time, '+07:00', '+00:00') END
        FROM action_history_legacy old
        JOIN devices d ON BINARY d.type = BINARY CASE LOWER(old.device)
          WHEN 'light' THEN 'light'
          WHEN 'fan' THEN 'fan'
          WHEN 'ac' THEN 'air_conditioner'
        END
        WHERE old.action IN ('ON', 'OFF')
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id), device_id = VALUES(device_id),
          action = VALUES(action), status = VALUES(status),
          requested_at = VALUES(requested_at), completed_at = VALUES(completed_at)
      `);
    }
    await connection.commit();
    console.log("Legacy data migrated; *_legacy backup tables were retained");
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
