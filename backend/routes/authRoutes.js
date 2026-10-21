const express = require("express");
const controller = require("../controllers/authController");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");

const router = express.Router();
router.post("/login", asyncHandler(controller.login));
router.get("/me", authenticate, asyncHandler(controller.me));

module.exports = router;
