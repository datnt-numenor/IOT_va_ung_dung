const cors = require("cors");
const express = require("express");
const db = require("./config/db");
const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const actionHistoryRoutes = require("./routes/actionHistoryRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();
  const origins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/v1/health", async (req, res, next) => {
    try {
      await db.query("SELECT 1");
      res.json({ status: "ok", database: "connected" });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/v1/sensors", sensorRoutes.realtimeRouter);
  app.use("/api/v1/sensor-data", sensorRoutes.dataRouter);
  app.use("/api/v1/devices", deviceRoutes);
  app.use("/api/v1/action-history", actionHistoryRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
