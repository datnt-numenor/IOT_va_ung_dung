require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const target = process.argv[2];
  if (!['schema', 'seed'].includes(target)) throw new Error("Use: node scripts/runSql.js schema|seed");
  const database = process.env.DB_NAME;
  if (!database || !/^[A-Za-z0-9_]+$/.test(database)) throw new Error("DB_NAME is missing or invalid");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
    timezone: "Z",
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${database}\``);
    const sql = await fs.readFile(path.join(__dirname, "..", "database", `${target}.sql`), "utf8");
    await connection.query(sql);
    console.log(`${target}.sql completed for ${database}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
