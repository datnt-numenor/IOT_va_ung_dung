const db = require("../config/db");
const socketHub = require("../realtime/socketHub");
const deviceService = require("./deviceService");
const settingsService = require("./settingsService");

// LED cảnh báo là thiết bị thứ 4 (devices.id = 4, type 'warning'); lệnh ON làm LED nhấp nháy, OFF thì tắt.
const WARNING_DEVICE_ID = Number(process.env.WARNING_DEVICE_ID || 4);
const SYSTEM_USERNAME = "system";
// Chỉ tắt cảnh báo khi giá trị xuống dưới 95% ngưỡng, tránh nhấp nháy bật/tắt liên tục quanh ngưỡng.
const CLEAR_RATIO = 0.95;
const BUSY_RETRY_MS = 2000;
const FAILURE_RETRY_MS = 30000;

const state = {
  active: false,
  since: null,
  value: null,
  retryAt: 0,
  busy: false,
};
let systemUserId = null;

async function getSystemUserId() {
  if (systemUserId !== null) return systemUserId;
  const [[user]] = await db.execute("SELECT id FROM users WHERE username = ?", [
    SYSTEM_USERNAME,
  ]);
  if (!user)
    throw new Error("System user not found; run npm run db:add-alert-feature");
  systemUserId = user.id;
  return systemUserId;
}

// Sau khi backend khởi động lại, coi cảnh báo là đang bật nếu LED cảnh báo đang ON.
async function init() {
  const [[device]] = await db.execute(
    "SELECT current_status AS status FROM devices WHERE id = ?",
    [WARNING_DEVICE_ID],
  );
  state.active = device?.status === "ON";
  state.since = state.active ? new Date().toISOString() : null;
}

async function getStatus() {
  return {
    active: state.active,
    since: state.since,
    value: state.value,
    threshold: await settingsService.getAlertThreshold(),
    deviceId: WARNING_DEVICE_ID,
  };
}

// Gọi mỗi khi có bản ghi ánh sáng mới: vượt ngưỡng thì bật LED cảnh báo , hết vượt thì tắt.
async function evaluate(lightValue) {
  state.value = lightValue;
  if (state.busy || Date.now() < state.retryAt) return;

  const threshold = await settingsService.getAlertThreshold();
  const shouldStart = !state.active && lightValue > threshold;
  const shouldStop = state.active && lightValue < threshold * CLEAR_RATIO;
  if (!shouldStart && !shouldStop) return;

  state.busy = true;
  try {
    await deviceService.controlDevice({
      deviceId: WARNING_DEVICE_ID,
      action: shouldStart ? "ON" : "OFF",
      userId: await getSystemUserId(),
    });
    state.active = shouldStart;
    state.since = shouldStart ? new Date().toISOString() : null;
    socketHub.emitAlertUpdate(await getStatus());
  } catch (error) {
    // 409: thiết bị đang xử lệnh trước, thử lại sớm; lỗi khác (MQTT mất kết nối...) chờ lâu hơn để khỏi ghi lỗi liên tục.
    state.retryAt =
      Date.now() + (error.status === 409 ? BUSY_RETRY_MS : FAILURE_RETRY_MS);
    console.error("Warning LED command failed:", error.message);
  } finally {
    state.busy = false;
  }
}

// Sau khi người dùng đổi ngưỡng: đánh giá lại ngay với giá trị ánh sáng mới nhất và báo giao diện.
async function reevaluate() {
  state.retryAt = 0;
  if (state.value !== null) await evaluate(state.value);
  socketHub.emitAlertUpdate(await getStatus());
}

// Số lần cảnh báo mỗi ngày (giờ Việt Nam) trong `days` ngày gần nhất, tính từ lịch sử bật LED cảnh báo.
async function getDailyStats(days) {
  const [rows] = await db.execute(
    `SELECT DATE_FORMAT(CONVERT_TZ(requested_at, '+00:00', '+07:00'), '%Y-%m-%d') AS day, COUNT(*) AS total
     FROM action_history
     WHERE device_id = ? AND action = 'ON'
       AND requested_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
     GROUP BY day`,
    [WARNING_DEVICE_ID, days + 1],
  );
  const totals = new Map(rows.map((row) => [row.day, Number(row.total)]));
  const vietnamNow = Date.now() + 7 * 60 * 60 * 1000;
  const result = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(vietnamNow - offset * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    result.push({ date, total: totals.get(date) || 0 });
  }
  return {
    deviceId: WARNING_DEVICE_ID,
    days: result,
    total: result.reduce((sum, item) => sum + item.total, 0),
  };
}

module.exports = {
  init,
  getStatus,
  evaluate,
  reevaluate,
  getDailyStats,
  WARNING_DEVICE_ID,
};
