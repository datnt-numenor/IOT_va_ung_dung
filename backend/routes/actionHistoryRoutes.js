const express = require("express");
const controller = require("../controllers/actionHistoryController");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();
router.get("/", asyncHandler(controller.getActionHistory));

module.exports = router;
