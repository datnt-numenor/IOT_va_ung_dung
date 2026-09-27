const db = require("../config/db");
const { toIsoUtc } = require("../utils/query");

async function getActionHistory(options) {
  const { time, deviceId, action, status, page, size, sortColumn, sortDirection } = options;
  const conditions = [];
  const values = [];
  if (time) {
    conditions.push("DATE_FORMAT(CONVERT_TZ(ah.requested_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i:%s') LIKE ?");
    values.push(`${time}%`);
  }
  if (deviceId) { conditions.push("ah.device_id = ?"); values.push(deviceId); }
  if (action) { conditions.push("ah.action = ?"); values.push(action); }
  if (status) { conditions.push("ah.status = ?"); values.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const joins = `FROM action_history ah
    JOIN devices d ON d.id = ah.device_id
    JOIN users u ON u.id = ah.user_id`;
  const [[countRow]] = await db.execute(`SELECT COUNT(*) AS total ${joins} ${where}`, values);
  const [rows] = await db.execute(
    `SELECT ah.id, d.id AS deviceId, d.name AS deviceName,
            u.id AS userId, u.full_name AS performedBy,
            ah.action, ah.status, ah.requested_at AS requestedAt,
            ah.completed_at AS completedAt
     ${joins} ${where}
     ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`,
    [...values, size, (page - 1) * size],
  );
  const totalElements = Number(countRow.total);
  return {
    content: rows.map((row) => ({
      ...row,
      requestedAt: toIsoUtc(row.requestedAt),
      completedAt: toIsoUtc(row.completedAt),
    })),
    page, size, totalElements, totalPages: Math.ceil(totalElements / size),
  };
}

module.exports = { getActionHistory };
