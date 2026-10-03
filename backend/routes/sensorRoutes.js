const express = require("express");
const controller = require("../controllers/sensorController");
const asyncHandler = require("../middleware/asyncHandler");

const realtimeRouter = express.Router();
const dataRouter = express.Router();
realtimeRouter.get("/", asyncHandler(controller.listSensors));
realtimeRouter.get("/realtime", asyncHandler(controller.getRealtime));
realtimeRouter.get("/status", controller.getEsp32Status);
dataRouter.get("/chart", asyncHandler(controller.getChart));
dataRouter.get("/", asyncHandler(controller.getHistory));

module.exports = { realtimeRouter, dataRouter };
