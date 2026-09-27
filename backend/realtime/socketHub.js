let io;

function setSocketServer(socketServer) {
  io = socketServer;
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
  setSocketServer,
  emitSensorUpdate,
  emitDeviceUpdate,
  emitEsp32Status,
};
