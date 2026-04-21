## Why

Проект начинается с нуля — нужна базовая инфраструктура для Telegram бота на Telegraf: конфигурируемый запуск, логирование, подключение к БД и каркас для тестирования. Без этого невозможно развивать функциональность.

## What Changes

- Добавить CLI параметры при запуске: `--host`, `--port`, `--log-path`, `--log-pretty`
- Настроить логирование через pino + pino-pretty (с условным использованием pretty в development)
- Добавить подключение к PostgreSQL через pg (создать pool, инъекцию через контекст)
- Создать расширяемый BotContext с инфраструктурными сервисами (logger, db)
- Настроить Jest как тестовый фреймворк с TypeScript support
- Создать базовые тесты для проверки работоспособности инфраструктуры

## Capabilities

### New Capabilities

- `cli-startup`: CLI параметры при запуске приложения
- `pino-logging`: Логирование с pino, опциональный pino-pretty для терминала
- `postgres-connection`: Подключение к PostgreSQL через connection pool
- `bot-context`: Расширенный Telegraf context с инфраструктурными сервисами
- `jest-testing`: Jest как тестовый фреймворк с примером unit теста

### Modified Capabilities

- (нет)

## Impact

- Новая директория `src/` с модульной структурой
- Новые devDependencies: pino, pino-pretty, pg, jest
- Изменения в `package.json` (scripts, dependencies)
- Новый `jest.config.ts`