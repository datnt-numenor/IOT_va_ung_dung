const express = require("express");
const controller = require("../controllers/alertController");
const asyncHandler = require("../middleware/asyncHandler");
const { authorize, ROLES } = require("../middleware/authorize");

const router = express.Router();
router.get("/status", asyncHandler(controller.getStatus));
router.get("/stats", asyncHandler(controller.getStats));
// Đổi ngưỡng cảnh báo ảnh hưởng LED thật nên chỉ admin được phép.
router.put("/threshold", authorize(ROLES.ADMIN), asyncHandler(controller.setThreshold));

module.exports = router;
