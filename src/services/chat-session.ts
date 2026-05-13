/**
 * Chat session manager — tracks active operator↔user conversations.
 */
import type { Pool } from "pg";

export interface ChatSession {
  requestId: number;
  operatorId: number;       // operator's DB id (operators.id)
  operatorTelegramId: number;
  userTelegramId: number;
  paused: boolean;
}

const sessions = new Map<number, ChatSession>();

/**
 * Start a chat between operator and user.
 */
export function startChat(
  requestId: number,
  operatorId: number,
  operatorTelegramId: number,
  userTelegramId: number
): void {
  const session: ChatSession = {
    requestId,
    operatorId,
    operatorTelegramId,
    userTelegramId,
    paused: false,
  };
  sessions.set(operatorTelegramId, session);
  sessions.set(userTelegramId, session);
}

/**
 * End a chat session for both participants.
 */
export function endChat(telegramId: number): void {
  const session = sessions.get(telegramId);
  if (!session) return;
  sessions.delete(session.operatorTelegramId);
  sessions.delete(session.userTelegramId);
}

/**
 * Check if user is in active (non-paused) chat.
 */
export function isInActiveChat(telegramId: number): boolean {
  const s = sessions.get(telegramId);
  return !!s && !s.paused;
}

/**
 * Check if user is in any chat (including paused).
 */
export function isInAnyChat(telegramId: number): boolean {
  return sessions.has(telegramId);
}

/**
 * Get the chat partner's Telegram ID.
 */
export function getChatPartner(telegramId: number): number | null {
  const s = sessions.get(telegramId);
  if (!s) return null;
  return s.operatorTelegramId === telegramId
    ? s.userTelegramId
    : s.operatorTelegramId;
}

/**
 * Get full session info for a participant.
 */
export function getChatSession(telegramId: number): ChatSession | null {
  return sessions.get(telegramId) ?? null;
}

/**
 * Pause chat (operator only).
 */
export function pauseChat(telegramId: number): boolean {
  const s = sessions.get(telegramId);
  if (!s || s.operatorTelegramId !== telegramId) return false;
  s.paused = true;
  return true;
}

/**
 * Resume chat (operator only).
 */
export function resumeChat(telegramId: number): boolean {
  const s = sessions.get(telegramId);
  if (!s || s.operatorTelegramId !== telegramId) return false;
  s.paused = false;
  return true;
}

/**
 * Save a comment on a callback request in the database.
 */
export async function saveComment(
  pool: Pool,
  requestId: number,
  comment: string
): Promise<void> {
  await pool.query(
    `UPDATE callback_requests SET comment = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [comment, requestId]
  );
}
