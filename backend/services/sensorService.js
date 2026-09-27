const db = require("../config/db");
const HttpError = require("../utils/httpError");
const { toIsoUtc } = require("../utils/query");
const socketHub = require("../realtime/socketHub");

const SENSOR_TYPES = ["temperature", "humidity", "light"];

function mapSensorRow(row) {
  return {
    id: row.id,
    sensorId: row.sensorId,
    sensorType: row.sensorType,
    value: Number(row.value),
    unit: row.unit,
    measuredAt: toIsoUtc(row.measuredAt),
  };
}

async function getRealtime() {
  const [rows] = await db.execute(`
    SELECT sd.id, s.id AS sensorId, s.type AS sensorType, s.unit,
           sd.value, sd.measured_at AS measuredAt
    FROM sensors s
    JOIN sensor_data sd ON sd.id = (
      SELECT latest.id FROM sensor_data latest
      WHERE latest.sensor_id = s.id
      ORDER BY latest.measured_at DESC, latest.id DESC LIMIT 1
    )
    WHERE s.type IN ('temperature', 'humidity', 'light')
    ORDER BY FIELD(s.type, 'temperature', 'humidity', 'light')
  `);
  const data = rows.map(mapSensorRow);
  const timestamp = data.reduce(
    (latest, item) => (!latest || item.measuredAt > latest ? item.measuredAt : latest),
    null,
  );
  return { timestamp, data };
}

async function getChart({ from, to, limit }) {
  const series = { temperature: [], humidity: [], light: [] };
  await Promise.all(SENSOR_TYPES.map(async (type) => {
    const conditions = ["s.type = ?"];
    const values = [type];
    if (from) { conditions.push("sd.measured_at >= ?"); values.push(from); }
    if (to) { conditions.push("sd.measured_at <= ?"); values.push(to); }
    const [rows] = await db.execute(
      `SELECT sd.value, sd.measured_at AS measuredAt
       FROM sensor_data sd JOIN sensors s ON s.id = sd.sensor_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY sd.measured_at DESC, sd.id DESC LIMIT ?`,
      [...values, limit],
    );
    series[type] = rows.reverse().map((row) => ({
      time: toIsoUtc(row.measuredAt),
      value: Number(row.value),
    }));
  }));
  return { series };
}

async function getHistory({ field, keyword, page, size, sortColumn, sortDirection }) {
  const conditions = [];
  const values = [];
  if (keyword) {
    if (field === "time") {
      conditions.push("DATE_FORMAT(CONVERT_TZ(sd.measured_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i:%s') LIKE ?");
      values.push(`${keyword}%`);
    } else if (SENSOR_TYPES.includes(field)) {
      conditions.push("s.type = ?");
      values.push(field);
    } else {
      conditions.push(`(s.type LIKE ? OR s.name LIKE ? OR CAST(sd.value AS CHAR) LIKE ?
        OR DATE_FORMAT(CONVERT_TZ(sd.measured_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i:%s') LIKE ?)`);
      const pattern = `%${keyword}%`;
      values.push(pattern, pattern, pattern, pattern);
    }
  } else if (SENSOR_TYPES.includes(field)) {
    conditions.push("s.type = ?");
    values.push(field);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [[countRow]] = await db.execute(
    `SELECT COUNT(*) AS total FROM sensor_data sd
     JOIN sensors s ON s.id = sd.sensor_id ${where}`,
    values,
  );
  const offset = (page - 1) * size;
  const [rows] = await db.execute(
    `SELECT sd.id, s.id AS sensorId, s.type AS sensorType, s.unit,
            sd.value, sd.measured_at AS measuredAt
     FROM sensor_data sd JOIN sensors s ON s.id = sd.sensor_id
     ${where} ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
    [...values, size, offset],
  );
  const totalElements = Number(countRow.total);
  return {
    content: rows.map(mapSensorRow), page, size, totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "Sensor payload must be an object");
  }
  const measuredAt = payload.timestamp ? new Date(payload.timestamp) : new Date();
  if (Number.isNaN(measuredAt.getTime())) throw new HttpError(400, "Invalid sensor timestamp");
  const readings = SENSOR_TYPES.flatMap((type) => {
    if (payload[type] === undefined) return [];
    const value = Number(payload[type]);
    if (!Number.isFinite(value)) throw new HttpError(400, `${type} must be numeric`);
    return [{ type, value }];
  });
  if (!readings.length) throw new HttpError(400, "Payload has no supported sensor values");
  return { measuredAt, readings };
}

async function ingestSensorPayload(payload) {
  const { measuredAt, readings } = normalizePayload(payload);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const placeholders = readings.map(() => "?").join(", ");
    const [sensors] = await connection.query(
      `SELECT id, type, unit FROM sensors WHERE type IN (${placeholders})`,
      readings.map((reading) => reading.type),
    );
    const metadata = new Map(sensors.map((sensor) => [sensor.type, sensor]));
    const saved = [];
    for (const reading of readings) {
      const sensor = metadata.get(reading.type);
      if (!sensor) throw new Error(`Sensor metadata not found: ${reading.type}`);
      const [result] = await connection.execute(
        "INSERT INTO sensor_data (sensor_id, value, measured_at) VALUES (?, ?, ?)",
        [sensor.id, reading.value, measuredAt],
      );
      saved.push({
        id: result.insertId, sensorId: sensor.id, sensorType: reading.type,
        value: reading.value, unit: sensor.unit, measuredAt: measuredAt.toISOString(),
      });
    }
    await connection.commit();
    const event = { timestamp: measuredAt.toISOString(), data: saved };
    socketHub.emitSensorUpdate(event);
    return event;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getRealtime, getChart, getHistory, normalizePayload, ingestSensorPayload };
