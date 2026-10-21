const HttpError = require("./httpError");

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

// Giới hạn số lần đăng nhập sai theo địa chỉ IP, lưu trong bộ nhớ (đủ cho một instance backend).
const failures = new Map();

function recent(key, now) {
  const list = (failures.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

function assertAllowed(key, now = Date.now()) {
  if (recent(key, now).length >= MAX_FAILURES) {
    throw new HttpError(429, "Quá nhiều lần đăng nhập sai, vui lòng thử lại sau ít phút");
  }
}

function recordFailure(key, now = Date.now()) {
  failures.set(key, [...recent(key, now), now]);
}

function reset(key) {
  failures.delete(key);
}

module.exports = { assertAllowed, recordFailure, reset, MAX_FAILURES };
