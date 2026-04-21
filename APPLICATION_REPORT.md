# Telegram Support Bot - Application Report

## 1. Введение

Telegram-бот службы поддержки с системой FAQ, чатами между пользователями и операторами, а также административной панелью для управления.

### Основные возможности
- Просмотр FAQ по категориям
- Поиск по базе знаний
- Чат с оператором поддержки
- Административная панель
- Логирование запросов и статистика

### Технологический стек
- **Язык:** TypeScript
- **Фреймворк:** Telegraf v4
- **База данных:** PostgreSQL
- **Логирование:** Pino
- **CLI:** Commander

---

## 2. Архитектура и модули

### Структура проекта

```
src/
├── index.ts                    # Точка входа
├── config/                     # Конфигурация
├── context/                    # Расширенный контекст бота
├── handlers/                   # Обработчики команд
│   ├── user/                   # Команды пользователя
│   ├── operator/               # Команды оператора
│   └── admin/                  # Команды администратора
├── knowledge-base/             # Модуль базы знаний
├── middleware/                 # Промежуточное ПО
├── services/                   # Бизнес-логика
├── types/                      # TypeScript типы
└── utils/                      # Утилиты
```

### Основные модули

| Модуль | Описание |
|--------|----------|
| `index.ts` | Инициализация бота, middleware, регистрация обработчиков |
| `config/index.ts` | Загрузка и валидация конфигурации |
| `context/bot-context.ts` | Расширенный контекст с logger, db, session |
| `services/logger.ts` | Логирование (консоль, файл, аудит) |
| `services/database.ts` | Пул подключений PostgreSQL |
| `services/session.ts` | Управление сессиями (token-based auth) |
| `services/chat.ts` | Управление чатами и операторами |
| `services/faq.ts` | Операции с FAQ и категориями |
| `services/request-log.ts` | Логирование запросов и статистика |
| `services/schema.ts` | Инициализация схемы БД |

---

## 3. Сущности бизнес-логики

### Типы данных (src/types/index.ts)

```typescript
// Категория FAQ
interface FAQCategory {
  id: number;
  name: string;
  sort_order: number;
  is_default: boolean;
  created_at: Date;
}

// Вопрос-ответ
interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  created_at: Date;
}

// Оператор поддержки
interface Operator {
  id: number;
  user_id: number;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
}

// Администратор
interface Admin {
  id: number;
  user_id: number;
  password_hash: string;
  created_at: Date;
}

// Чат пользователя с оператором
interface Chat {
  id: number;
  user_id: number;
  operator_id: number | null;
  status: "waiting" | "active" | "closed";
  category: string | null;
  started_at: Date;
  ended_at: Date | null;
}

// Сообщение в чате
interface ChatMessage {
  id: number;
  chat_id: number;
  sender_type: "user" | "operator" | "system";
  text: string;
  created_at: Date;
}

// Заблокированный пользователь
interface BannedUser {
  id: number;
  user_id: number;
  reason: string;
  banned_at: Date;
}

// Лог запроса
interface RequestLog {
  id: number;
  user_id: number;
  text: string;
  category: string | null;
  result_type: "auto_response" | "escalation" | "error";
  response_time_ms: number;
  created_at: Date;
}

// Сессия пользователя
interface Session {
  token: string;
  type: "admin" | "operator";
  user_id: number;
  expires_at: Date;
}

// Статистика запросов
interface RequestStatistics {
  total: number;
  auto_responses: number;
  escalations: number;
  average_response_time_ms: number;
  period_start: Date;
  period_end: Date;
}
```

---

## 4. Инфраструктура

### База данных (PostgreSQL)

Схема создается автоматически при первом запуске (services/schema.ts):

```sql
-- Таблицы:
faqs              -- Вопросы-ответы
faq_categories    -- Категории FAQ
operators         -- Операторы поддержки
admins            -- Администраторы
chats             -- Чаты пользователей
messages          -- Сообщения в чатах
banned_users      -- Заблокированные пользователи
request_logs      -- Логи запросов
```

### Логирование

Модуль `services/logger.ts` поддерживает:
- Консольный вывод (pino-pretty)
- Файловый лог (INFO уровень)
- verbose-лог (DEBUG уровень)
- Аудит-лог (отдельный файл для действий пользователей)

### Конфигурация

Настройки через переменные окружения (.env):
- `BOT_TOKEN` - Telegram API токен
- `DATABASE_URL` - Строка подключения к PostgreSQL
- `ADMIN_PASSWORD` - Пароль администратора
- `OPERATOR_PASSWORD` - Пароль оператора
- `SESSION_EXPIRY_HOURS` - Время жизни сессии
- `LOG_LEVEL` - Уровень логирования
- `LOG_FILE`, `LOG_VERBOSE_FILE`, `LOG_AUDIT_FILE` - Пути к файлам логов

---

## 5. Use Cases

### Пользователь
1. `/start` - Показать приветствие и меню категорий FAQ
2. `/menu` - Показать меню категорий
3. `/search <запрос>` - Поиск по базе знаний
4. `/support` - Начать чат с оператором
5. `/end` - Завершить текущий чат

### Оператор
1. `/operator login <пароль>` - Авторизация
2. `/operator logout` - Выход
3. `/operator available` - Установить статус "доступен"
4. `/operator busy` - Установить статус "занят"
5. `/chats` - Показать активные чаты
6. `/reply <id> <сообщение>` - Отправить ответ
7. `/end <id>` - Завершить чат
8. `/ban <user_id> [причина]` - Заблокировать пользователя

### Администратор
1. `/admin login <пароль>` - Авторизация
2. `/admin logout` - Выход
3. `/admin add-operator <telegram_id> <пароль>` - Добавить оператора
4. `/admin remove-operator <telegram_id>` - Удалить оператора
5. `/admin list-operators` - Список операторов
6. `/admin create-category | <название>` - Создать категорию FAQ
7. `/admin delete-category <id>` - Удалить категорию
8. `/admin add-faq |<категория_id>|<вопрос>|<ответ>` - Добавить FAQ
9. `/admin delete-faq <id>` - Удалить FAQ
10. `/admin stats [дни]` - Статистика запросов

---

## 6. Руководство пользователя

### Начало работы

1. Откройте бота в Telegram
2. Нажмите `/start` для просмотра меню
3. Выберите категорию для просмотра FAQ
4. Используйте `/search <ключевое слово>` для поиска

### Получение поддержки

1. Отправьте `/support` для связи с оператором
2. Дождитесь подключения оператора
3. Задайте свой вопрос
4. После решения проблемы используйте `/end`

---

## 7. Руководство администратора

### Первый вход

```
/admin login <пароль_администратора>
```

### Управление операторами

```bash
# Добавить оператора
/admin add-operator 123456789 password123

# Удалить оператора
/admin remove-operator 123456789

# Список операторов
/admin list-operators
```

### Управление FAQ

```bash
# Создать категорию
/admin create-category | Общие вопросы

# Удалить категорию
/admin delete-category 1

# Добавить FAQ
/admin add-faq |1|Как с вами связаться?|Напишите нам в чат|

# Удалить FAQ
/admin delete-faq 5

# Просмотр статистики (за 7 дней по умолчанию)
/admin stats 30
```

---

## 8. Руководство оператора

### Авторизация

```
/operator login <пароль>
```

### Управление статусом

```
/operator available   # Я доступен
/operator busy        # Я занят
```

### Работа с чатами

```bash
# Просмотр активных чатов
/chats

# Ответ пользователю
/reply 15 Привет! Чем могу помочь?

# Завершение чата
/end 15

# Блокировка пользователя
/ban 987654321 Спам
```

---

## 9. Инструкция установки

### Требования

- Node.js 18+
- PostgreSQL 14+
- Telegram Bot Token

### Установка

```bash
# Клонирование репозитория
git clone <repo-url>
cd tgbotrusnet

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
# Отредактируйте .env файл

# Инициализация базы данных
npm run bot db:init

# Запуск в режиме разработки
npm run dev

# Продакшен сборка
npm run build
npm start
```

### Команды CLI

```bash
npm run bot -- db:config --url "postgresql://user:pass@localhost:5432/db"
npm run bot -- db:init
npm run bot -- db:init --force
npm run bot -- log:config --level info
npm run bot -- log:config --show
```

---

## 10. ERD (Entity-Relationship Diagram)

```
┌─────────────────────┐       ┌─────────────────────┐
│   faq_categories    │       │       faqs          │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │──1:N──│ id (PK)             │
│ name                │       │ category_id (FK)    │
│ sort_order          │       │ question            │
│ is_default          │       │ answer              │
│ created_at          │       │ created_at          │
└─────────────────────┘       └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│      operators      │       │       chats         │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │◄──1:N──│ id (PK)             │
│ user_id             │       │ user_id (FK)        │
│ password_hash       │       │ operator_id (FK)    │
│ is_active           │       │ status              │
│ created_at          │       │ category            │
└─────────────────────┘       │ started_at          │
                              │ ended_at            │
                              └─────────┬───────────┘
                                        │ 1:N
                              ┌─────────▼───────────┐
                              │      messages       │
                              ├─────────────────────┤
                              │ id (PK)             │
                              │ chat_id (FK)        │
                              │ sender_type         │
                              │ text                │
                              │ created_at          │
                              └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│    banned_users     │       │   request_logs      │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ user_id (UNIQUE)    │       │ user_id             │
│ reason              │       │ text                │
│ banned_at           │       │ category            │
└─────────────────────┘       │ result_type         │
                              │ response_time_ms    │
                              │ created_at          │
                              └─────────────────────┘
```

---

## 11. История изменений (OpenSpec)

| Change | Дата | Описание |
|--------|------|----------|
| `bot-foundation-infrastructure` | 2026-04-21 | Базовая инфраструктура: Telegraf, PostgreSQL, Pino логирование, CLI |
| `support-operator-chat` | 2026-04-21 | Система поддержки: FAQ, чаты, сессии операторов/админов |
| `cli-setup-tools` | 2026-04-21 | CLI утилиты: db:config, db:init, log:config |
| `fix-user-interaction-flow` | 2026-04-21 | Исправление user flow |
| `verbose-logging` | 2026-04-21 | verbose логирование |
| `transition-to-commander-cli` | 2026-04-21 | Переход на Commander.js |
| `logging-refactoring` | 2026-04-21 | Рефакторинг логирования: multi-destination, audit |
| `logger-refactoring` | 2026-04-21 | Рефакторинг logger |
| `add-business-logic-tests` | 2026-04-21 | Unit тесты для бизнес-логики |
| `mass-code-documentation` | 2026-04-21 | JSDoc документация |

---

*Документ сгенерирован автоматически*