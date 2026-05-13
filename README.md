# Telegram Bot — Служба поддержки

Telegram-бот для обработки заявок на обратный звонок с возможностью прямого чата между оператором и пользователем.

Built with [Telegraf v4](https://telegraf.js.org/) + TypeScript + PostgreSQL.

---

## Функционал

### Пользователь

| Команда | Описание |
|---------|----------|
| `/start` | Главное меню с категориями FAQ |
| `/menu` | Меню категорий |
| `/support` | Создать заявку на обратный звонок |
| `/scenes` | Быстрые кнопки (FAQ, заявка) |
| Любой текст в чате | Если заявка принята — пересылается оператору |

### Администратор

| Команда | Описание |
|---------|----------|
| `/admin_login` | Вход в панель администратора (запросит пароль) |
| `/admin_logout` | Выход |
| `/admin_add_operator` | Добавить оператора (логин → пароль) |
| `/admin_remove_operator` | Удалить оператора |
| `/admin_list_operators` | Список операторов |
| `/create_category` | Создать категорию FAQ |
| `/delete_category` | Удалить категорию FAQ |
| `/add_faq` | Добавить вопрос FAQ (ID категории → вопрос → ответ) |
| `/delete_faq` | Удалить вопрос FAQ |
| `/stats` | Статистика запросов |

### Оператор

| Команда | Описание |
|---------|----------|
| `/operator_login` | Вход (запросит логин → пароль) |
| `/operator_logout` | Выход |
| `/operator_available` | Статус «свободен» |
| `/operator_busy` | Статус «занят» |
| `/requests` | Список ожидающих заявок |
| `/take` | Взять заявку (вход в чат с клиентом) |
| `/done` | Завершить заявку (в режиме чата) |
| `/pause` | Поставить чат на паузу |
| `/resume` | Возобновить чат |
| `/unassign` | Вернуть заявку в пул |
| `/comment` | Добавить комментарий к заявке |
| `/cancel_request` | Отменить заявку |
| `/stats` | Статистика запросов |

### Режим отладки

Запуск с флагом `-d` / `--debug` добавляет команду `/debug`, которая показывает полный список всех команд.

---

## Установка

### Требования

- Node.js 18+
- PostgreSQL 14+
- npm

### Шаги

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd tgbotrusnet

# 2. Установить зависимости
npm install

# 3. Настроить окружение
cp .env.example .env
```

Отредактировать `.env`:

```env
BOT_TOKEN=токен_бота_от_BotFather
DATABASE_URL=postgresql://user:password@localhost:5432/botdb
ADMIN_PASSWORD=пароль_администратора
```

### Запуск

```bash
# Сбросить и инициализировать БД (только при первом запуске или после изменений схемы)
npm run bot db:init -- --force

# Запустить бота
start-server.bat

# Или напрямую:
npm run build
npm start

# Режим отладки:
start-debug.bat
```

---

## Обслуживание

### Сброс базы данных

При изменениях схемы (добавлении таблиц, колонок) нужно пересоздать БД:

```bash
npm run bot db:init -- --force
```

**Внимание:** удаляет все данные.

### Сборка

```bash
npm run build           # Компиляция TypeScript → dist/
npm run dev             # Запуск через ts-node (без сборки)
```

### Тесты

```bash
npm test                # Запуск всех тестов
npm run test:watch      # Режим наблюдения
```

### Линтер и форматтер

```bash
npm run lint            # ESLint
npm run format          # Prettier (автоисправление)
```

### Логи

Логи пишутся в файлы, указанные в `.env`:

| Параметр | Пример | Описание |
|----------|--------|----------|
| `LOG_FILE` | `logs/bot.log` | Основной лог |
| `LOG_AUDIT_FILE` | `logs/audit.log` | Аудит действий пользователей |
| `LOG_VERBOSE_FILE` | `logs/debug.log` | Детальный лог (с флагом -v) |

---

## Архитектура

```
src/
├── index.ts                  # Точка входа, middleware chain
├── config/index.ts           # Конфигурация из .env
├── context/bot-context.ts    # Расширенный Telegraf Context
├── handlers/
│   ├── admin/
│   │   ├── session.ts        # /admin_login, /admin_logout, /admin_add_operator и др.
│   │   ├── faq.ts            # /create_category, /delete_category
│   │   ├── faq-manage.ts     # /add_faq, /delete_faq
│   │   └── stats.ts          # /stats
│   ├── operator/
│   │   ├── session.ts        # /operator_login, /operator_logout, /operator_available, /operator_busy
│   │   ├── callback.ts       # /requests, /take, /done, /pause, /resume, /unassign, /comment, /cancel_request
│   │   └── stats.ts          # /stats
│   └── user/
│       ├── faq.ts            # /start, /menu, inline FAQ
│       └── chat.ts           # /support
├── scenes/
│   └── index.ts              # Telegraf Scenes (callback request flow)
├── services/
│   ├── schema.ts             # Инициализация БД
│   ├── database.ts           # Pool подключения
│   ├── session.ts            # Токены сессий
│   ├── logger.ts             # Pino-логгер
│   ├── faq.ts                # FAQ service
│   ├── chat.ts               # Операторы (CRUD + поиск по логину)
│   ├── callback.ts           # Заявки на обратный звонок
│   ├── chat-session.ts       # Менеджер активных чатов (in-memory)
│   └── request-log.ts        # Логирование запросов
├── middleware/
│   ├── auth.ts               # Admin/operator auth middleware
│   └── error-handler.ts      # Error handler + Unknown command handler
├── constants/
│   └── callbacks.ts          # Callback data constants
├── types/
│   └── index.ts              # TypeScript интерфейсы
└── utils/
    ├── cli.ts                # CLI arguments + db:init команда
    └── config-helper.ts      # .env reader/writer
```

---

## Жизненный цикл заявки

```
Пользователь                    Оператор
    │                              │
    ├── /support                   │
    │   └── описывает проблему     │
    │                              │
    │   [заявка создана: pending]  │
    │                              ├── /requests
    │                              │   └── видит список
    │                              ├── /take 1
    │                              │   └── входит в чат
    │◄── ── бот уведомляет ── ────►│
    │                              │
    ├── «привет»                   │
    │   ───────► бот ────────►     │  💼 Оператор: привет
    │◄── ──── бот ─────────        │  👤 Пользователь: здравствуйте
    │   «здравствуйте»             │
    │                              ├── /done
    │◄── ── заявка выполнена ──    │
    │                              │
    │   [заявка: completed]        │
```

---

## License

ISC
