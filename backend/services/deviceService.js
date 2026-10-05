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

async function listDevices() {
  const [rows] = await db.execute(
    `SELECT id, code, name, type, current_status AS currentStatus, updated_at AS updatedAt
     FROM devices ORDER BY id`,
  );
  return rows.map((device) => ({ ...device, updatedAt: toIsoUtc(device.updatedAt) }));
}

// Last state confirmed by the ESP32; used to restore the device when a command fails.
async function lastConfirmedStatus(connection, deviceId) {
  const [[row]] = await connection.execute(
    `SELECT status FROM action_history
     WHERE device_id = ? AND status IN ('ON', 'OFF')
     ORDER BY id DESC LIMIT 1`,
    [deviceId],
  );
  return row ? row.status : "OFF";
}

async function markFailed(actionId, deviceId) {
  const connection = await db.getConnection();
  let restored = null;

  try {
    await connection.beginTransaction();
    await connection.execute("SELECT id FROM devices WHERE id = ? FOR UPDATE", [deviceId]);
    const [result] = await connection.execute(
      `UPDATE action_history
       SET status = 'FAILED', completed_at = UTC_TIMESTAMP(3)
       WHERE id = ? AND device_id = ? AND status = 'LOADING'`,
      [actionId, deviceId],
    );

    if (result.affectedRows > 0) {
      restored = await lastConfirmedStatus(connection, deviceId);
      await connection.execute(
        `UPDATE devices
         SET current_status = ?, updated_at = UTC_TIMESTAMP(3)
         WHERE id = ? AND current_status = 'LOADING'`,
        [restored, deviceId],
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
  if (restored) {
    socketHub.emitDeviceUpdate({ actionId, deviceId, currentStatus: restored, status: "FAILED" });
  }
}

async function controlDevice({ deviceId, action, userId }) {
  const connection = await db.getConnection();
  let actionId;

  try {
    await connection.beginTransaction();
    const [[device]] = await connection.execute(
      `SELECT id, current_status AS currentStatus
       FROM devices
       WHERE id = ?
       FOR UPDATE`,
      [deviceId],
    );
    if (!device) throw new HttpError(404, `Device not found: ${deviceId}`);
    if (device.currentStatus === "LOADING") throw new HttpError(409, "Device is busy");

    const [history] = await connection.execute(
      `INSERT INTO action_history (user_id, device_id, action, status, requested_at)
       VALUES (?, ?, ?, 'LOADING', UTC_TIMESTAMP(3))`,
      [userId, deviceId, action],
    );
    actionId = history.insertId;

    await connection.execute(
      `UPDATE devices
       SET current_status = 'LOADING', updated_at = UTC_TIMESTAMP(3)
       WHERE id = ?`,
      [deviceId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_NO_REFERENCED_ROW_2") throw new HttpError(400, `Unknown user: ${userId}`);
    throw error;
  } finally {
    connection.release();
  }

  socketHub.emitDeviceUpdate({ actionId, deviceId, currentStatus: "LOADING", status: "LOADING" });

  try {
    await mqttService.publish(mqttService.getTopics().command, { actionId, deviceId, action });
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

async function handleDeviceStatus(payload) {
  // Replies to a SYNC replay only restore the LED; they are not user actions.
  if (payload.source === "SYNC") return null;

  const deviceId = Number(payload.deviceId);
  if (!Number.isInteger(deviceId) || deviceId < 1) {
    throw new Error("Device status requires a positive deviceId");
  }
  const actionId = Number(payload.actionId);
  const status = String(payload.status || "").toUpperCase();
  if (!Number.isInteger(actionId) || actionId < 1) {
    throw new Error("Device status requires a positive actionId");
  }
  if (!["ON", "OFF", "FAILED"].includes(status)) {
    throw new Error(`Unsupported device status: ${status || "empty"}`);
  }

  let currentStatus;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [[device]] = await connection.execute(
      "SELECT id FROM devices WHERE id = ? FOR UPDATE",
      [deviceId],
    );
    if (!device) throw new Error(`Device not found: ${deviceId}`);

    // The ESP32 is the source of truth: accept a late confirmation of a FAILED action too.
    const [[action]] = await connection.execute(
      "SELECT status FROM action_history WHERE id = ? AND device_id = ? FOR UPDATE",
      [actionId, deviceId],
    );
    if (!action) throw new Error(`Pending action not found: ${actionId}`);
    if (action.status !== "LOADING" && (action.status !== "FAILED" || status === "FAILED")) {
      throw new Error(`Action ${actionId} already finished with status ${action.status}`);
    }

    await connection.execute(
      "UPDATE action_history SET status = ?, completed_at = UTC_TIMESTAMP(3) WHERE id = ?",
      [status, actionId],
    );

    const [[newer]] = await connection.execute(
      "SELECT id FROM action_history WHERE device_id = ? AND id > ? LIMIT 1",
      [deviceId, actionId],
    );
    if (newer) {
      currentStatus = null;
    } else {
      currentStatus = status === "FAILED" ? await lastConfirmedStatus(connection, deviceId) : status;
      await connection.execute(
        "UPDATE devices SET current_status = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?",
        [currentStatus, deviceId],
      );
    }
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

  if (currentStatus === null) return { actionId, deviceId, status };
  const event = { actionId, deviceId, currentStatus, status };
  socketHub.emitDeviceUpdate(event);
  return event;
}

const MAX_SYNC_DEVICES = 20;

// ESP32 (re)connected and asks for the last known state of its devices.
async function handleSyncRequest(payload) {
  const deviceIds = payload?.deviceIds;
  if (
    !Array.isArray(deviceIds) || !deviceIds.length || deviceIds.length > MAX_SYNC_DEVICES
    || !deviceIds.every((id) => Number.isInteger(id) && id > 0)
  ) {
    throw new Error("Sync request requires 1-20 positive integer deviceIds");
  }

  const [devices] = await db.query(
    "SELECT id, current_status AS currentStatus FROM devices WHERE id IN (?)",
    [deviceIds],
  );
  await Promise.all(devices.map(async (device) => {
    // LOADING/FAILED are not physical states; replay the last state the ESP32 confirmed.
    const action = ["ON", "OFF"].includes(device.currentStatus)
      ? device.currentStatus
      : await lastConfirmedStatus(db, device.id);
    await mqttService.publish(mqttService.getTopics().command, {
      actionId: 0, deviceId: device.id, action, source: "SYNC",
    });
  }));
}

module.exports = { listDevices, getDeviceStatus, controlDevice, handleDeviceStatus, handleSyncRequest };
