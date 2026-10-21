const { Server } = require("socket.io");

let io;

// Mỗi sự kiện có một tên (sensor:update, device:update, esp32:status) kèm dữ liệu JSON.
// Socket.IO tự lo heartbeat và cho phép client tự kết nối lại.
// `verifyToken` (nếu có) kiểm tra token client gửi trong handshake `auth.token`; sai thì từ chối kết nối.
function attachSocketServer(httpServer, { allowedOrigins = [], verifyToken } = {}) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins },
    // Từ chối trang web không nằm trong FRONTEND_ORIGIN; client không gửi Origin (script, công cụ) vẫn được phép.
    allowRequest: (req, callback) => {
      const { origin } = req.headers;
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  });

  if (verifyToken) {
    io.use((socket, next) => {
      try {
        socket.data.user = verifyToken(socket.handshake.auth?.token);
        next();
      } catch {
        next(new Error("Authentication required"));
      }
    });
  }
  return io;
}

// Đóng cả các kết nối đang mở lẫn HTTP server bên dưới.
function closeSocketServer() {
  return io ? io.close() : Promise.resolve();
}

function emitSensorUpdate(payload) {
  io?.emit("sensor:update", payload);
}

function emitDeviceUpdate(payload) {
  io?.emit("device:update", payload);
}

function emitEsp32Status(payload) {
  io?.emit("esp32:status", payload);
}

module.exports = {
  attachSocketServer,
  closeSocketServer,
  emitSensorUpdate,
  emitDeviceUpdate,
  emitEsp32Status,
};
