import pg from "pg";
import type { Logger } from "./logger";

const { Pool } = pg;

/**
 * Type alias for PostgreSQL Pool.
 */
export type DatabasePool = pg.Pool;

/**
 * Creates and configures a PostgreSQL connection pool.
 * @param logger - Logger instance for connection events
 * @returns Configured DatabasePool instance
 */
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

/**
 * Closes the database connection pool.
 * @param pool - The DatabasePool to close
 * @param logger - Logger instance for closure events
 */
export async function closeDatabasePool(pool: DatabasePool, logger: Logger): Promise<void> {
  logger.info("Closing database pool...");
  await pool.end();
  logger.info("Database pool closed");
}