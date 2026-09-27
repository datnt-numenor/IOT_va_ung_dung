const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  timezone: "Z",
  decimalNumbers: true,
});

pool.on("connection", (connection) => {
  connection.query("SET SESSION time_zone = '+00:00'", (error) => {
    if (error) console.error("Unable to set MySQL session timezone to UTC:", error.message);
  });
});

module.exports = pool;
