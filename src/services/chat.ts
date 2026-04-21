import type { Pool } from "pg";
import type { Chat, ChatMessage, Operator } from "../types/index.js";

export async function startChat(
  pool: Pool,
  userId: number,
  category: string | null = null
): Promise<Chat> {
  const result = await pool.query(
    `INSERT INTO chats (user_id, status, category) 
     VALUES ($1, 'waiting', $2) 
     RETURNING id, user_id, operator_id, status, category, started_at, ended_at`,
    [userId, category]
  );
  return result.rows[0];
}

export async function getActiveChats(pool: Pool): Promise<Chat[]> {
  const result = await pool.query(
    `SELECT id, user_id, operator_id, status, category, started_at, ended_at 
     FROM chats 
     WHERE status IN ('waiting', 'active') 
     ORDER BY started_at`
  );
  return result.rows;
}

export async function getActiveChatsForOperator(
  pool: Pool,
  operatorId: number
): Promise<Chat[]> {
  const result = await pool.query(
    `SELECT id, user_id, operator_id, status, category, started_at, ended_at 
     FROM chats 
     WHERE operator_id = $1 AND status IN ('waiting', 'active') 
     ORDER BY started_at`,
    [operatorId]
  );
  return result.rows;
}

export async function assignOperatorToChat(
  pool: Pool,
  chatId: number,
  operatorId: number
): Promise<Chat | null> {
  const result = await pool.query(
    `UPDATE chats 
     SET operator_id = $1, status = 'active' 
     WHERE id = $2 AND status = 'waiting' 
     RETURNING id, user_id, operator_id, status, category, started_at, ended_at`,
    [operatorId, chatId]
  );
  return result.rows[0] ?? null;
}

export async function sendMessage(
  pool: Pool,
  chatId: number,
  senderType: "user" | "operator" | "system",
  text: string
): Promise<ChatMessage> {
  const result = await pool.query(
    `INSERT INTO messages (chat_id, sender_type, text) 
     VALUES ($1, $2, $3) 
     RETURNING id, chat_id, sender_type, text, created_at`,
    [chatId, senderType, text]
  );
  return result.rows[0];
}

export async function getChatHistory(
  pool: Pool,
  chatId: number
): Promise<ChatMessage[]> {
  const result = await pool.query(
    `SELECT id, chat_id, sender_type, text, created_at 
     FROM messages 
     WHERE chat_id = $1 
     ORDER BY created_at`,
    [chatId]
  );
  return result.rows;
}

export async function endChat(pool: Pool, chatId: number): Promise<Chat | null> {
  const result = await pool.query(
    `UPDATE chats 
     SET status = 'closed', ended_at = CURRENT_TIMESTAMP 
     WHERE id = $1 
     RETURNING id, user_id, operator_id, status, category, started_at, ended_at`,
    [chatId]
  );
  return result.rows[0] ?? null;
}

export async function banUser(
  pool: Pool,
  userId: number,
  reason: string
): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO banned_users (user_id, reason) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id) DO UPDATE SET reason = $2, banned_at = CURRENT_TIMESTAMP`,
      [userId, reason]
    );
    return true;
  } catch {
    return false;
  }
}

export async function isUserBanned(pool: Pool, userId: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM banned_users WHERE user_id = $1`,
    [userId]
  );
  return result.rows.length > 0;
}

export async function getAvailableOperators(
  pool: Pool
): Promise<Operator[]> {
  const result = await pool.query(
    `SELECT id, user_id, password_hash, is_active, created_at 
     FROM operators 
     WHERE is_active = TRUE`
  );
  return result.rows;
}

export async function setOperatorStatus(
  pool: Pool,
  operatorId: number,
  isActive: boolean
): Promise<void> {
  await pool.query(
    `UPDATE operators SET is_active = $1 WHERE id = $2`,
    [isActive, operatorId]
  );
}

export async function getChatById(pool: Pool, chatId: number): Promise<Chat | null> {
  const result = await pool.query(
    `SELECT id, user_id, operator_id, status, category, started_at, ended_at 
     FROM chats WHERE id = $1`,
    [chatId]
  );
  return result.rows[0] ?? null;
}

export async function addOperator(
  pool: Pool,
  userId: number,
  passwordHash: string
): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO operators (user_id, password_hash) VALUES ($1, $2)`,
      [userId, passwordHash]
    );
    return true;
  } catch {
    return false;
  }
}

export async function removeOperator(
  pool: Pool,
  userId: number
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM operators WHERE user_id = $1`,
    [userId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listOperators(pool: Pool): Promise<Operator[]> {
  const result = await pool.query(
    `SELECT id, user_id, password_hash, is_active, created_at 
     FROM operators ORDER BY id`
  );
  return result.rows;
}