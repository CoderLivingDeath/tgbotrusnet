## Context

Проект Telegram бота на Telegraf v4 с TypeScript. Текущее состояние — только базовый boilerplate с `src/index.ts`. Необходима инфраструктура для разработки.

## Goals / Non-Goals

**Goals:**
- Конфигурируемый запуск через CLI параметры
- Логирование с pino + pino-pretty
- Подключение к PostgreSQL через пул соединений
- Расширяемый BotContext с инфраструктурой
- Jest как тестовый фреймворк

**Non-Goals:**
- Конкретные команды или handlers
- Аутентификация пользователей
- Продакшен деплой (CI/CD)
- Полноценные интеграционные тесты

## Decisions

### 1. CLI через minimist вместо yargs
Альтернативы: yargs (богаче, но тяжелее), commander. minimist достаточен для простых флагов `--host`, `--port`, etc. Легковесный, нет лишних зависимостей.

### 2. pino + pino-pretty для логирования
pino выбран за производительность (5x быстрее winston). pino-pretty декоративный — раскрашивает и форматирует вывод в терминале, но не используется если `--log-path` указан (запись в файл).

### 3. pg для PostgreSQL (не TypeORM/Prisma)
Альтернативы: TypeORM, Prisma, Drizzle. pg выбран как lightweight решение — прямые SQL запросы, простой пул соединений. Для бота не нужна ORM сложность.

### 4. Сервисы через getter в BotContext
Инфраструктурные сервисы (logger, db) добавляются в Telegraf `Context` через computed properties. Это следует паттерну Telegraf и позволяет легко внедрять их в handlers.

### 5. Jest для тестирования
Альтернативы: Vitest. Jest выбран за широкую поддержку и простую интеграцию с ts-jest.

## Risks / Trade-offs

- [Logger не инициализирован при ошибках при старте] → Логировать в stderr напрямую до инициализации pino
- [pg pool не закрывается при graceful shutdown] → Добавить обработчик SIGTERM/SIGINT в index.ts
- [pino-pretty опасен в продакшене] → Условное использование только с флагом `--log-pretty` или в development

## Migration Plan

1. Установить зависимости: minimist, pino, pino-pretty, pg, jest, ts-jest
2. Создать структуру `src/{services,context,utils}/`
3. Реализовать services: logger, database
4. Расширить BotContext
5. Обновить `src/index.ts` с CLI parsing
6. Настроить jest.config.ts
7. Создать пример теста
8. Запустить `npm run dev` для проверки

## Open Questions

- Нужен ли graceful shutdown для БД пула? (пока нет, но заложить основу)
- Формат логов? (JSON по умолчанию для machine reading)