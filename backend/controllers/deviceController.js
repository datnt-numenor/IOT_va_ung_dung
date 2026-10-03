const deviceService = require("../services/deviceService");
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
  const action = enumValue(req.body?.action, ["ON", "OFF"], "action");
  const userId = positiveInteger(
    req.header("x-user-id") || process.env.DEFAULT_USER_ID || 1,
    1,
    "userId",
  );
  res.status(202).json(await deviceService.controlDevice({ deviceId, action, userId }));
}

module.exports = { listDevices, getDeviceStatus, controlDevice };
