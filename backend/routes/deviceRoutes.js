const express = require("express");
const controller = require("../controllers/deviceController");
const asyncHandler = require("../middleware/asyncHandler");
const { authorize, ROLES } = require("../middleware/authorize");

const router = express.Router();
router.get("/", asyncHandler(controller.listDevices));
router.get("/:deviceId/status", asyncHandler(controller.getDeviceStatus));
// Gửi lệnh điều khiển là thao tác thay đổi thiết bị thật nên chỉ vai trò admin được phép.
router.post(
  "/:deviceId/actions",
  authorize(ROLES.ADMIN),
  asyncHandler(controller.controlDevice),
);

module.exports = router;
