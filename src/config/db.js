const mysql = require("mysql2/promise");

let pool;

function buildMysqlConfig() {
  // Prefer MYSQL_URL when available; otherwise use discrete vars.
  if (process.env.MYSQL_URL) {
    return {
      uri: process.env.MYSQL_URL,
    };
  }

  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  const port = Number(process.env.MYSQL_PORT || 3306);

  if (!host || !user || !database) {
    throw new Error(
      "Missing MySQL env vars. Provide MYSQL_URL or MYSQL_HOST/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE."
    );
  }

  return { host, user, password, database, port };
}

async function initDb() {
  if (pool) return pool;

  const cfg = buildMysqlConfig();
  pool = mysql.createPool(
    cfg.uri
      ? {
          uri: cfg.uri,
          connectionLimit: 10,
          waitForConnections: true,
        }
      : {
          host: cfg.host,
          port: cfg.port,
          user: cfg.user,
          password: cfg.password || "",
          database: cfg.database,
          connectionLimit: 10,
          waitForConnections: true,
          charset: "utf8mb4",
        }
  );

  // Fail fast on boot.
  await pool.query("SELECT 1");
  return pool;
}

function getDb() {
  if (!pool) {
    throw new Error("DB not initialized. Call initDb() before handling requests.");
  }
  return pool;
}

module.exports = { initDb, getDb };

