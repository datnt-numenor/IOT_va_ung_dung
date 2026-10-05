require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const db = require("./config/db");
const createApp = require("./app");
const sensorService = require("./services/sensorService");
const deviceService = require("./services/deviceService");
const mqttService = require("./services/mqttService");
const esp32PresenceService = require("./services/esp32PresenceService");
const socketHub = require("./realtime/socketHub");

const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins },
});
socketHub.setSocketServer(io);

async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL connected successfully");

    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
}

testDatabaseConnection();
mqttService.startMqtt({
  onSensorData: async (payload) => {
    const event = await sensorService.ingestSensorPayload(payload);
    esp32PresenceService.recordHeartbeat();
    return event;
  },
  onDeviceStatus: deviceService.handleDeviceStatus,
  onSyncRequest: deviceService.handleSyncRequest,
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close();
  esp32PresenceService.close();
  await mqttService.closeMqtt();
  await db.end();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
