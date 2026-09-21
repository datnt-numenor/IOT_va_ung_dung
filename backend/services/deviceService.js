const actionHistoryService = require("./actionHistoryService");

const deviceStatus = {
  light: "OFF",
  fan: "OFF",
  ac: "OFF",
};

function controlDevice(device, action) {
  const now = new Date();

  const time = now.toISOString().slice(0, 19).replace("T", " ");

  const historyRecord = actionHistoryService.addActionHistory({
    device,
    user: "Nguyễn Tiến Đạt",
    action,
    status: "LOADING",
    time,
  });

  return {
    device,
    action,
    status: "LOADING",
    historyRecord,
  };
}

function getDeviceStatus() {
  return deviceStatus;
}

module.exports = {
  controlDevice,
  getDeviceStatus,
};
