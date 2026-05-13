import type { Pool } from "pg";
import type { Logger } from "../services/logger";
import type { RequestStatistics } from "../types/index";

/**
 * Represents a pending request waiting for a response.
 */
export interface PendingRequest {
  user_id: number;
  text: string;
  category: string | null;
  started_at: Date;
}

const pendingRequests = new Map<number, PendingRequest>();

/**
 * Logs a user request to the database.
 * @param pool - PostgreSQL connection pool
 * @param userId - The user's ID
 * @param message - The message text
 * @param handler - The handler that processed the request (category)
 * @param logger - Logger instance for debugging
 */
export async function logRequest(
  pool: Pool,
  userId: number,
  message: string,
  handler: string | null,
  logger: Logger
): Promise<void> {
  const startedAt = new Date();

  pendingRequests.set(userId, {
    user_id: userId,
    text: message,
    category: handler,
    started_at: startedAt,
  });

  try {
    await pool.query(
      `INSERT INTO request_logs (user_id, text, category, created_at) VALUES ($1, $2, $3, $4)`,
      [userId, message, handler, startedAt]
    );

    logger.debug({ userId, handler }, "Request logged");
  } catch (error) {
    logger.error({ error, userId }, "Failed to log request");
  }
}

/**
 * Logs a response to complete a request entry.
 * Updates the request log with result type and response time.
 * @param pool - PostgreSQL connection pool
 * @param userId - The user's ID
 * @param resultType - The type of result (auto_response, escalation, error)
 * @param logger - Logger instance for debugging
 */
export async function logResponse(
  pool: Pool,
  userId: number,
  resultType: "auto_response" | "escalation" | "callback_request" | "error",
  logger: Logger
): Promise<void> {
  const pending = pendingRequests.get(userId);

  if (!pending) {
    return;
  }

  const responseTimeMs = Date.now() - pending.started_at.getTime();

  try {
    await pool.query(
      `UPDATE request_logs 
       SET result_type = $1, response_time_ms = $2 
       WHERE user_id = $3 AND created_at = $4`,
      [resultType, responseTimeMs, userId, pending.started_at]
    );

    pendingRequests.delete(userId);

    logger.debug({ userId, resultType, responseTimeMs }, "Response logged");
  } catch (error) {
    logger.error({ error, userId }, "Failed to log response");
  }
}

/**
 * Retrieves request statistics for a given time period.
 * @param pool - PostgreSQL connection pool
 * @param days - Number of days to look back (default: 7)
 * @returns RequestStatistics object with counts and average response time
 */
export async function getStatistics(
  pool: Pool,
  days: number = 7
): Promise<RequestStatistics> {
  const periodEnd = new Date();
  const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN result_type = 'auto_response' THEN 1 END) as auto_responses,
        COUNT(CASE WHEN result_type = 'escalation' THEN 1 END) as escalations,
        COALESCE(AVG(response_time_ms), 0) as avg_response_time
       FROM request_logs 
       WHERE created_at >= $1`,
      [periodStart]
    );

    const row = result.rows[0];

    return {
      total: parseInt(row.total, 10),
      auto_responses: parseInt(row.auto_responses, 10),
      escalations: parseInt(row.escalations, 10),
      average_response_time_ms: parseFloat(row.avg_response_time),
      period_start: periodStart,
      period_end: periodEnd,
    };
  } catch {
    return {
      total: 0,
      auto_responses: 0,
      escalations: 0,
      average_response_time_ms: 0,
      period_start: periodStart,
      period_end: periodEnd,
    };
  }
}