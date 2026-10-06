const { WebSocketServer, WebSocket } = require("ws");

const HEARTBEAT_INTERVAL_MS = 30000;

let wss;
let heartbeatTimer;

// Each message is a JSON envelope: { "type": "sensor:update", "data": { ... } }
function broadcast(type, data) {
  if (!wss) return;
  const message = JSON.stringify({ type, data });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  }
}

function attachWebSocketServer(httpServer, { path = "/ws", allowedOrigins = [] } = {}) {
  wss = new WebSocketServer({
    server: httpServer,
    path,
    verifyClient: ({ origin }) => !origin || allowedOrigins.includes(origin),
  });

  wss.on("connection", (client) => {
    client.isAlive = true;
    client.on("pong", () => {
      client.isAlive = true;
    });
    // Clients only listen; ignore anything they send.
    client.on("message", () => {});
  });

  // Drop connections that stopped answering ping (closed laptop, lost Wi-Fi...).
  heartbeatTimer = setInterval(() => {
    for (const client of wss.clients) {
      if (!client.isAlive) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref?.();

  return wss;
}

function closeWebSocketServer() {
  clearInterval(heartbeatTimer);
  if (!wss) return Promise.resolve();
  for (const client of wss.clients) client.terminate();
  return new Promise((resolve) => wss.close(() => resolve()));
}

function emitSensorUpdate(payload) {
  broadcast("sensor:update", payload);
}

function emitDeviceUpdate(payload) {
  broadcast("device:update", payload);
}

function emitEsp32Status(payload) {
  broadcast("esp32:status", payload);
}

module.exports = {
  attachWebSocketServer,
  closeWebSocketServer,
  emitSensorUpdate,
  emitDeviceUpdate,
  emitEsp32Status,
};
