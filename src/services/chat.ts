import type { Pool } from "pg";
import type { Operator } from "../types/index.js";

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
    `SELECT id, login, user_id, password_hash, is_active, created_at 
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

export async function addOperator(
  pool: Pool,
  login: string,
  passwordHash: string
): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO operators (login, password_hash) VALUES ($1, $2)`,
      [login, passwordHash]
    );
    return true;
  } catch {
    return false;
  }
}

export async function removeOperator(
  pool: Pool,
  login: string
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM operators WHERE login = $1`,
    [login]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listOperators(pool: Pool): Promise<Operator[]> {
  const result = await pool.query(
    `SELECT id, login, user_id, password_hash, is_active, created_at 
     FROM operators ORDER BY id`
  );
  return result.rows;
}

/**
 * Find operator by login.
 */
export async function findOperatorByLogin(
  pool: Pool,
  login: string
): Promise<Operator | null> {
  const result = await pool.query(
    `SELECT id, login, user_id, password_hash, is_active, created_at 
     FROM operators WHERE login = $1`,
    [login]
  );
  return result.rows[0] ?? null;
}

export async function addAdmin(
  pool: Pool,
  userId: number,
  passwordHash: string
): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO admins (user_id, password_hash) VALUES ($1, $2)`,
      [userId, passwordHash]
    );
    return true;
  } catch {
    return false;
  }
}

