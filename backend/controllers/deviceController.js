const alertService = require("../services/alertService");
const deviceService = require("../services/deviceService");
const HttpError = require("../utils/httpError");
const { positiveInteger, enumValue } = require("../utils/query");

async function listDevices(req, res) {
  res.json({ data: await deviceService.listDevices() });
}

async function getDeviceStatus(req, res) {
  const deviceId = positiveInteger(req.params.deviceId, null, "deviceId");
  res.json(await deviceService.getDeviceStatus(deviceId));
}

async function controlDevice(req, res) {
  const deviceId = positiveInteger(req.params.deviceId, null, "deviceId");
  // Đèn cảnh báo chỉ do hệ thống bật/tắt theo ngưỡng ánh sáng, không ai (kể cả admin) điều khiển tay được.
  if (deviceId === alertService.WARNING_DEVICE_ID) {
    throw new HttpError(403, "Đèn cảnh báo tự động bật/tắt theo ngưỡng ánh sáng, không điều khiển thủ công");
  }
  const action = enumValue(req.body?.action, ["ON", "OFF"], "action");
  // Người thực hiện lấy từ token đã xác thực, không tin dữ liệu client tự khai.
  const userId = req.user.id;
  res
    .status(202)
    .json(await deviceService.controlDevice({ deviceId, action, userId }));
}

module.exports = { listDevices, getDeviceStatus, controlDevice };
