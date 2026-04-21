import pg from "pg";
import type { Logger } from "./logger.js";

const { Pool } = pg;

export type DatabasePool = pg.Pool;

export function createDatabasePool(logger: Logger): DatabasePool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.warn("DATABASE_URL not set, database pool not initialized");
    return new Pool();
  }

  const pool = new Pool({ connectionString: databaseUrl });

  pool.on("connect", () => {
    logger.debug("New database connection established");
  });

  pool.on("error", (err) => {
    logger.error({ err }, "Unexpected database pool error");
  });

  logger.info("Database pool initialized");
  return pool;
}

export async function closeDatabasePool(pool: DatabasePool, logger: Logger): Promise<void> {
  logger.info("Closing database pool...");
  await pool.end();
  logger.info("Database pool closed");
}