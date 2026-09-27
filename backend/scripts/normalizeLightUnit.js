require("dotenv").config();

const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: "Z",
  });

  try {
    const [result] = await connection.execute(
      "UPDATE sensors SET unit = ? WHERE type = ? AND unit <> ?",
      ["ADC", "light", "ADC"],
    );
    const [sensors] = await connection.execute(
      "SELECT id, code, type, unit FROM sensors WHERE type = ?",
      ["light"],
    );

    if (sensors.length === 0) {
      throw new Error("Light sensor metadata was not found");
    }

    console.log(`Light sensor unit normalized to ADC (${result.affectedRows} row updated)`);
    console.table(sensors);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
