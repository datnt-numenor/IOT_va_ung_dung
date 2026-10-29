const db = require("../config/db");
const HttpError = require("../utils/httpError");
const { VALUE_RANGES } = require("../utils/sensorRanges");

const THRESHOLD_KEY = "light_alert_threshold";
const DEFAULT_THRESHOLD = 500;

let cachedThreshold = null;

// Ngưỡng cảnh báo ánh sáng X (cùng thang với giá trị ánh sáng hiển thị), lưu trong bảng settings.
async function getAlertThreshold() {
  if (cachedThreshold !== null) return cachedThreshold;
  const [[row]] = await db.execute("SELECT setting_value FROM settings WHERE setting_key = ?", [THRESHOLD_KEY]);
  cachedThreshold = row ? Number(row.setting_value) : DEFAULT_THRESHOLD;
  return cachedThreshold;
}

async function setAlertThreshold(value) {
  const [minimum, maximum] = VALUE_RANGES.light;
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new HttpError(400, `threshold must be a number from ${minimum} to ${maximum}`);
  }
  const rounded = Math.round(value * 100) / 100;
  await db.execute(
    `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [THRESHOLD_KEY, String(rounded)],
  );
  cachedThreshold = rounded;
  return rounded;
}

module.exports = { getAlertThreshold, setAlertThreshold };
