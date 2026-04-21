import type { Pool } from "pg";
import type { Logger } from "../services/logger";

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
ON CONFLICT DO NOTHING
`;

const INSERT_SAMPLE_FAQS = `
INSERT INTO faqs (category_id, question, answer) VALUES
  (1, 'Как восстановить пароль?', 'Для восстановления пароля перейдите в раздел "Восстановление доступа" на сайте и следуйте инструкциям. Вам на почту будет отправлена ссылка для сброса пароля.'),
  (1, 'Я не могу войти в аккаунт, что делать?', 'Проверьте правильность ввода логина и пароля. Если забыли пароль, воспользуйтесь функцией восстановления. При многократных неудачных попытках войти, аккаунт может быть временно заблокирован - обратитесь в поддержку.'),
  (1, 'Как изменить пароль?', 'Войдите в настройки профиля, выберите раздел "Безопасность" и нажмите "Изменить пароль". Рекомендуется использовать сложный пароль не менее 8 символов.'),

  (2, 'Как проверить статус заявки?', 'Отправьте номер вашей заявки боту, и он покажет текущий статус: "На рассмотрении", "В работе", "Завершено" или "Отклонено".'),
  (2, 'Сколько времени рассматривается заявка?', 'Среднее время рассмотрения заявки составляет 24-48 часов. Сложные заявки могут обрабатываться до 5 рабочих дней.'),
  (2, 'Могу ли я отозвать заявку?', 'Да, вы можете отозвать заявку до её завершения. Для этого нажмите кнопку "Отозвать" в меню заявки или свяжитесь с оператором.'),

  (3, 'Какие услуги вы предоставляете?', 'Мы предоставляем полный спектр услуг: хостинг, доменные имена, SSL-сертификаты, техническая поддержка и консультации. Подробнее на нашем сайте.'),
  (3, 'Как с вами связаться?', 'Вы можете связаться с нами через этот бот, отправив сообщение в категорию "Связаться с оператором", написать на email support@rusnet.ru или позвонить по телефону.'),
  (3, 'Работаете ли вы в выходные?', 'Да, мы работаем круглосуточно 7 дней в неделю. Техническая поддержка доступна в любое время.'),

  (4, 'Как связаться с оператором?', 'Нажмите кнопку "Связаться с оператором" в главном меню бота или отправьте команду /support. Оператор ответит вам в течение нескольких минут.'),
  (4, 'Сколько ждать ответа оператора?', 'Среднее время ожидания ответа оператора составляет 5-15 минут в рабочее время. В пиковые периоды время может увеличиться до 30 минут.'),
  (4, 'Можно ли получить консультацию по телефону?', 'Да, для получения консультации по телефону оставьте заявку через бот с пометкой "Требуется звонок". Оператор перезвонит вам в течение рабочего дня.')
ON CONFLICT DO NOTHING
`;

export async function initializeSchema(pool: Pool, logger: Logger): Promise<void> {
  try {
    logger.info("Initializing database schema...");

    const tableCheck = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'faq_categories'
    `);
    
    if (parseInt(tableCheck.rows[0].count, 10) > 0) {
      logger.info("Database already initialized, checking for FAQs...");

      const faqCheck = await pool.query(`SELECT COUNT(*) as count FROM faqs`);
      if (parseInt(faqCheck.rows[0].count, 10) === 0) {
        await pool.query(INSERT_SAMPLE_FAQS);
        logger.info("Sample FAQs inserted");
      } else {
        logger.info("FAQs already exist, skipping seeding");
      }
      
      return;
    }

    await pool.query(CREATE_TABLES);
    logger.info("Database tables created successfully");

    await pool.query(INSERT_DEFAULT_CATEGORIES);
    logger.info("Default categories inserted");

    await pool.query(INSERT_SAMPLE_FAQS);
    logger.info("Sample FAQs inserted");

    logger.info("Database schema initialization complete");
  } catch (error) {
    logger.error({ error }, "Failed to initialize database schema");
    throw error;
  }
}

/**
 * Result of data validation containing validity status and error messages.
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates user data for operators and admins.
 * @param data - Object containing user_id and optional password_hash
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateUserData(data: {
  user_id?: number;
  password_hash?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (data.user_id === undefined || data.user_id === null) {
    errors.push("user_id is required");
  } else if (typeof data.user_id !== "number" || data.user_id <= 0) {
    errors.push("user_id must be a positive number");
  }

  if (data.password_hash !== undefined) {
    if (typeof data.password_hash !== "string" || data.password_hash.length < 1) {
      errors.push("password_hash must be a non-empty string");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates chat data for creating or updating chat sessions.
 * @param data - Object containing user_id, operator_id, status, and category
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateChatData(data: {
  user_id?: number;
  operator_id?: number | null;
  status?: string;
  category?: string | null;
}): ValidationResult {
  const errors: string[] = [];

  if (data.user_id === undefined || data.user_id === null) {
    errors.push("user_id is required");
  } else if (typeof data.user_id !== "number" || data.user_id <= 0) {
    errors.push("user_id must be a positive number");
  }

  if (data.status !== undefined) {
    const validStatuses = ["waiting", "active", "closed"];
    if (!validStatuses.includes(data.status)) {
      errors.push(`status must be one of: ${validStatuses.join(", ")}`);
    }
  }

  if (data.category !== undefined && data.category !== null) {
    if (typeof data.category !== "string" || data.category.length > 255) {
      errors.push("category must be a string with max 255 characters");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates FAQ data for creating or updating FAQ entries.
 * @param data - Object containing category_id, question, and answer
 * @returns ValidationResult with valid flag and any error messages
 */
export function validateFaqData(data: {
  category_id?: number;
  question?: string;
  answer?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (data.category_id === undefined || data.category_id === null) {
    errors.push("category_id is required");
  } else if (typeof data.category_id !== "number" || data.category_id <= 0) {
    errors.push("category_id must be a positive number");
  }

  if (data.question === undefined || data.question === null) {
    errors.push("question is required");
  } else if (typeof data.question !== "string" || data.question.length < 1) {
    errors.push("question must be a non-empty string");
  }

  if (data.answer === undefined || data.answer === null) {
    errors.push("answer is required");
  } else if (typeof data.answer !== "string" || data.answer.length < 1) {
    errors.push("answer must be a non-empty string");
  }

  return { valid: errors.length === 0, errors };
}