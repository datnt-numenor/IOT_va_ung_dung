const deviceService = require("../services/deviceService");

function controlDevice(req, res) {
  const { device, action } = req.body;

  if (!device || !action) {
    return res.status(400).json({
      message: "device and action are required",
    });
  }

  if (!["light", "fan", "ac"].includes(device)) {
    return res.status(400).json({
      message: "Invalid device",
    });
  }

  if (!["ON", "OFF"].includes(action)) {
    return res.status(400).json({
      message: "Invalid action",
    });
  }

  const result = deviceService.controlDevice(device, action);

  return res.status(200).json({
    message: "Control request received",
    ...result,
  });
}

function getDeviceStatus(req, res) {
  const status = deviceService.getDeviceStatus();

  return res.status(200).json({
    data: status,
  });
}

module.exports = {
  controlDevice,
  getDeviceStatus,
};
