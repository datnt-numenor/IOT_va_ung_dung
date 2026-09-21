const express = require("express");

const deviceController = require("../controllers/deviceController");

const router = express.Router();

router.get("/status", deviceController.getDeviceStatus);

router.post("/control", deviceController.controlDevice);

module.exports = router;
