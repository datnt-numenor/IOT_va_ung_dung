require("dotenv").config();

const express = require("express");
const db = require("./config/db");

const deviceRoutes = require("./routes/deviceRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const actionHistoryRoutes = require("./routes/actionHistoryRoutes");

const app = express();

const PORT = 3000;

async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL connected successfully");

    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
}

testDatabaseConnection();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("IoT Smart Room Backend is running");
});

app.use("/api/devices", deviceRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/action-history", actionHistoryRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
