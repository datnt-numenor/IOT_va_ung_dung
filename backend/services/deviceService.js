const db = require("../config/db");
const socketHub = require("../realtime/socketHub");
const HttpError = require("../utils/httpError");
const { toIsoUtc } = require("../utils/query");
const mqttService = require("./mqttService");

const pendingTimeouts = new Map();

async function getDeviceStatus(deviceId) {
  const [[device]] = await db.execute(
    `SELECT id, code, name, type,
            current_status AS currentStatus,
            updated_at AS updatedAt
     FROM devices
     WHERE id = ?`,
    [deviceId],
  );

  if (!device) throw new HttpError(404, `Device not found: ${deviceId}`);
  return { ...device, updatedAt: toIsoUtc(device.updatedAt) };
}

async function markFailed(actionId, deviceId) {
  const connection = await db.getConnection();
  let changed = false;

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE action_history
       SET status = 'FAILED', completed_at = UTC_TIMESTAMP(3)
       WHERE id = ? AND device_id = ? AND status = 'LOADING'`,
      [actionId, deviceId],
    );

    changed = result.affectedRows > 0;
    if (changed) {
      await connection.execute(
        `UPDATE devices
         SET current_status = 'FAILED', updated_at = UTC_TIMESTAMP(3)
         WHERE id = ?`,
        [deviceId],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  pendingTimeouts.delete(actionId);
  if (changed) {
    socketHub.emitDeviceUpdate({ actionId, deviceId, currentStatus: "FAILED", status: "FAILED" });
  }
}

async function controlDevice({ deviceId, action, userId }) {
  const connection = await db.getConnection();
  let actionId;
  let commandTopic;

  try {
    await connection.beginTransaction();
    const [[device]] = await connection.execute(
      `SELECT id, command_topic AS commandTopic
       FROM devices
       WHERE id = ?
       FOR UPDATE`,
      [deviceId],
    );
    if (!device) throw new HttpError(404, `Device not found: ${deviceId}`);

    const [history] = await connection.execute(
      `INSERT INTO action_history (user_id, device_id, action, status, requested_at)
       VALUES (?, ?, ?, 'LOADING', UTC_TIMESTAMP(3))`,
      [userId, deviceId, action],
    );
    actionId = history.insertId;
    commandTopic = device.commandTopic;

    await connection.execute(
      `UPDATE devices
       SET current_status = 'LOADING', updated_at = UTC_TIMESTAMP(3)
       WHERE id = ?`,
      [deviceId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  socketHub.emitDeviceUpdate({ actionId, deviceId, currentStatus: "LOADING", status: "LOADING" });

  try {
    await mqttService.publish(commandTopic, { actionId, deviceId, action });
  } catch (error) {
    await markFailed(actionId, deviceId);
    throw new HttpError(503, `Unable to publish device command: ${error.message}`);
  }

  const timeoutMs = Number(process.env.DEVICE_TIMEOUT_MS || 5000);
  const timeout = setTimeout(() => {
    markFailed(actionId, deviceId)
      .catch((error) => console.error("Device timeout update failed:", error));
  }, timeoutMs);
  pendingTimeouts.set(actionId, timeout);

  return { actionId, deviceId, action, status: "LOADING" };
}

async function handleDeviceStatus(deviceId, payload) {
  const actionId = Number(payload.actionId);
  const status = String(payload.status || "").toUpperCase();
  if (!Number.isInteger(actionId) || actionId < 1) {
    throw new Error("Device status requires a positive actionId");
  }
  if (!["ON", "OFF", "FAILED"].includes(status)) {
    throw new Error(`Unsupported device status: ${status || "empty"}`);
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[device]] = await connection.execute(
      "SELECT id FROM devices WHERE id = ? FOR UPDATE",
      [deviceId],
    );
    if (!device) throw new Error(`Device not found: ${deviceId}`);

    const [history] = await connection.execute(
      `UPDATE action_history
       SET status = ?, completed_at = UTC_TIMESTAMP(3)
       WHERE id = ? AND device_id = ? AND status = 'LOADING'`,
      [status, actionId, deviceId],
    );
    if (!history.affectedRows) {
      throw new Error(`Pending action not found: ${actionId}`);
    }

    await connection.execute(
      `UPDATE devices
       SET current_status = ?, updated_at = UTC_TIMESTAMP(3)
       WHERE id = ?`,
      [status, deviceId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const timeout = pendingTimeouts.get(actionId);
  if (timeout) clearTimeout(timeout);
  pendingTimeouts.delete(actionId);

  const event = { actionId, deviceId, currentStatus: status, status };
  socketHub.emitDeviceUpdate(event);
  return event;
}

module.exports = { getDeviceStatus, controlDevice, handleDeviceStatus };
