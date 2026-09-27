const socketHub = require("../realtime/socketHub");

const DEFAULT_OFFLINE_TIMEOUT_MS = 8000;

let lastSeen = null;
let offlineTimer = null;

function getTimeoutMs() {
  const configured = Number(process.env.ESP32_OFFLINE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_OFFLINE_TIMEOUT_MS;
}

function getStatus() {
  const timeoutMs = getTimeoutMs();
  const online = Boolean(
    lastSeen && Date.now() - new Date(lastSeen).getTime() < timeoutMs,
  );
  return { online, lastSeen, timeoutMs };
}

function recordHeartbeat() {
  lastSeen = new Date().toISOString();
  socketHub.emitEsp32Status(getStatus());

  clearTimeout(offlineTimer);
  offlineTimer = setTimeout(() => {
    socketHub.emitEsp32Status(getStatus());
  }, getTimeoutMs());
  offlineTimer.unref?.();
}

function close() {
  clearTimeout(offlineTimer);
  offlineTimer = null;
}

module.exports = { getStatus, recordHeartbeat, close };
