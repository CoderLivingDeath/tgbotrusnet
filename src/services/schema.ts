import type { Pool } from "pg";
import type { Logger } from "../services/logger.js";

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS faq_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  category VARCHAR(255),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banned_users (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_logs (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  text TEXT,
  category VARCHAR(255),
  result_type VARCHAR(20) DEFAULT 'auto_response',
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const INSERT_DEFAULT_CATEGORIES = `
INSERT INTO faq_categories (name, sort_order, is_default) VALUES
  ('Восстановление доступа', 1, TRUE),
  ('Статус заявки', 2, TRUE),
  ('Общие вопросы', 3, TRUE),
  ('Связаться с оператором', 4, TRUE)
ON CONFLICT DO NOTHING;
`;

export async function initializeSchema(pool: Pool, logger: Logger): Promise<void> {
  try {
    logger.info("Initializing database schema...");

    await pool.query(CREATE_TABLES);
    logger.info("Database tables created successfully");

    await pool.query(INSERT_DEFAULT_CATEGORIES);
    logger.info("Default categories inserted");

    logger.info("Database schema initialization complete");
  } catch (error) {
    logger.error({ error }, "Failed to initialize database schema");
    throw error;
  }
}