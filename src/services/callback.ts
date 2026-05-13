import type { Pool } from "pg";
import type { CallbackRequest, Operator } from "../types/index.js";

/**
 * Creates a new callback request for a user.
 * The request starts in "pending" status awaiting an operator.
 */
export async function createCallbackRequest(
  pool: Pool,
  userId: number,
  message: string
): Promise<CallbackRequest> {
  const result = await pool.query(
    `INSERT INTO callback_requests (user_id, message, status)
     VALUES ($1, $2, 'pending')
     RETURNING id, user_id, operator_id, message, status, comment, created_at, updated_at`,
    [userId, message]
  );
  return result.rows[0];
}

/**
 * Returns all callback requests with "pending" status,
 * ordered by creation time (oldest first).
 */
export async function getPendingCallbackRequests(
  pool: Pool
): Promise<CallbackRequest[]> {
  const result = await pool.query(
    `SELECT id, user_id, operator_id, message, status, comment, created_at, updated_at
     FROM callback_requests
     WHERE status = 'pending'
     ORDER BY created_at`
  );
  return result.rows;
}

/**
 * Retrieves a single callback request by its id,
 * or null if not found.
 */
export async function getCallbackRequestById(
  pool: Pool,
  requestId: number
): Promise<CallbackRequest | null> {
  const result = await pool.query(
    `SELECT id, user_id, operator_id, message, status, comment, created_at, updated_at
     FROM callback_requests
     WHERE id = $1`,
    [requestId]
  );
  return result.rows[0] ?? null;
}

/**
 * Atomically assigns a pending request to an operator.
 * Uses UPDATE ... WHERE status = 'pending' to prevent races.
 * Returns the updated request or null if already taken.
 */
export async function assignCallbackRequest(
  pool: Pool,
  requestId: number,
  operatorId: number
): Promise<CallbackRequest | null> {
  const result = await pool.query(
    `UPDATE callback_requests
     SET operator_id = $1, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND status = 'pending'
     RETURNING id, user_id, operator_id, message, status, comment, created_at, updated_at`,
    [operatorId, requestId]
  );
  return result.rows[0] ?? null;
}

/**
 * Marks an in_progress request as completed.
 * Returns the updated request or null if not found / wrong status.
 */
export async function completeCallbackRequest(
  pool: Pool,
  requestId: number
): Promise<CallbackRequest | null> {
  const result = await pool.query(
    `UPDATE callback_requests
     SET status = 'completed', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'in_progress'
     RETURNING id, user_id, operator_id, message, status, comment, created_at, updated_at`,
    [requestId]
  );
  return result.rows[0] ?? null;
}

/**
 * Cancels a request (any status except completed).
 * Returns the updated request or null if not found.
 */
export async function cancelCallbackRequest(
  pool: Pool,
  requestId: number
): Promise<CallbackRequest | null> {
  const result = await pool.query(
    `UPDATE callback_requests
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status IN ('pending', 'in_progress')
     RETURNING id, user_id, operator_id, message, status, comment, created_at, updated_at`,
    [requestId]
  );
  return result.rows[0] ?? null;
}

/**
 * Returns all callback requests for a specific user,
 * newest first.
 */
export async function getUserCallbackRequests(
  pool: Pool,
  userId: number
): Promise<CallbackRequest[]> {
  const result = await pool.query(
    `SELECT id, user_id, operator_id, message, status, comment, created_at, updated_at
     FROM callback_requests
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Sends a notification about a new callback request to all active operators.
 * Uses ctx.telegram.sendMessage to deliver the notification.
 */
export async function notifyOperators(
  pool: Pool,
  telegram: { sendMessage: (chatId: number, text: string, extra?: Record<string, unknown>) => Promise<unknown> },
  request: CallbackRequest
): Promise<void> {
  const result = await pool.query(
    `SELECT id, user_id FROM operators WHERE is_active = TRUE`
  );
  const operators: Pick<Operator, "id" | "user_id">[] = result.rows;

  const message =
    `📞 Новая заявка на обратный звонок #${request.id}\n\n` +
    `От пользователя: ${request.user_id}\n` +
    `Описание: ${request.message.substring(0, 200)}`;

  for (const op of operators) {
    if (op.user_id === null) continue;
    try {
      await telegram.sendMessage(op.user_id, message);
    } catch {
      // If notification fails for one operator, continue with others
    }
  }
}
