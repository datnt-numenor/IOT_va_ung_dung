const express = require("express");

const sensorController = require("../controllers/sensorController");

const router = express.Router();

router.get("/", sensorController.getSensors);

module.exports = router;
