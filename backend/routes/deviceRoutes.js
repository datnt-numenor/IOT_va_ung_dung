const express = require("express");
const controller = require("../controllers/deviceController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(controller.listDevices));
router.get("/:deviceId/status", asyncHandler(controller.getDeviceStatus));
router.post("/:deviceId/actions", asyncHandler(controller.controlDevice));

module.exports = router;
