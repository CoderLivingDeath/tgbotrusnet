-- Reset database: drops and recreates all tables with correct schema
-- WARNING: This will DELETE ALL data!

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS callback_requests CASCADE;
DROP TABLE IF EXISTS request_logs CASCADE;
DROP TABLE IF EXISTS banned_users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS faq_categories CASCADE;

-- Create tables with CORRECT schema (text/category for request_logs)
CREATE TABLE faq_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE operators (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  category VARCHAR(255),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banned_users (
  id SERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE callback_requests (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE request_logs (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  text TEXT,
  category VARCHAR(255),
  result_type VARCHAR(20) DEFAULT 'auto_response',
  response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default FAQ categories
INSERT INTO faq_categories (name, sort_order, is_default) VALUES
  ('Восстановление доступа', 1, TRUE),
  ('Статус заявки', 2, TRUE),
  ('Общие вопросы', 3, TRUE),
  ('Связаться с оператором', 4, TRUE);

-- Insert sample FAQs
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
  (4, 'Можно ли получить консультацию по телефону?', 'Да, для получения консультации по телефону оставьте заявку через бот с пометкой "Требуется звонок". Оператор перезвонит вам в течение рабочего дня.');

-- Update CLI schema too (it has old column names)
-- File: src/utils/cli.ts lines ~343-349 need update from message/handler to text/category

SELECT 'Database reset complete!' as status;