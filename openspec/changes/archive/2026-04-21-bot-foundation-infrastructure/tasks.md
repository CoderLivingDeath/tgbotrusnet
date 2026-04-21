## 1. Project Setup

- [x] 1.1 Install dependencies: minimist, pino, pino-pretty, pg, jest, ts-jest, @types/pg
- [x] 1.2 Update package.json scripts (add test script)
- [x] 1.3 Create jest.config.js with ts-jest preset
- [x] 1.4 Create project directory structure: src/services, src/context, src/utils

## 2. CLI Startup Infrastructure

- [x] 2.1 Create src/utils/cli.ts for parsing CLI arguments (minimist)
- [x] 2.2 Define CLIArgs interface with host, port, logPath, logPretty fields
- [x] 2.3 Set default values: host=0.0.0.0, port=3000, no log file, pretty=true
- [x] 2.4 Export typed CLI parsing function

## 3. Logging Service (pino)

- [x] 3.1 Create src/services/logger.ts
- [x] 3.2 Implement logger initialization with pino
- [x] 3.3 Add conditional pino-pretty for terminal output
- [x] 3.4 Configure JSON output when logPath is specified
- [x] 3.5 Export typed logger instance with child logger support

## 4. Database Service (pg)

- [x] 4.1 Create src/services/database.ts
- [x] 4.2 Create pg Pool instance using DATABASE_URL from environment
- [x] 4.3 Implement graceful shutdown with pool.end()
- [x] 4.4 Add SIGTERM/SIGINT handlers for cleanup
- [x] 4.5 Export typed pool instance

## 5. BotContext Extension

- [x] 5.1 Create src/context/bot-context.ts
- [x] 5.2 Extend Telegraf Context type with logger and db properties
- [x] 5.3 Implement context decorator middleware
- [x] 5.4 Inject logger and db into each update context

## 6. Main Entry Point Updates

- [x] 6.1 Update src/index.ts to parse CLI arguments
- [x] 6.2 Initialize logger with CLI configuration
- [x] 6.3 Initialize database pool on startup
- [x] 6.4 Apply context middleware to bot
- [x] 6.5 Add basic /start command handler for testing
- [x] 6.6 Add graceful shutdown handling

## 7. Testing Setup

- [x] 7.1 Create src/services/__tests__/logger.test.ts
- [x] 7.2 Add unit test for logger instantiation
- [x] 7.3 Create src/utils/__tests__/cli.test.ts
- [x] 7.4 Add unit test for CLI argument parsing
- [ ] 7.5 Run tests to verify setup (requires @types/jest package - install when network available)

## 8. Verification

- [x] 8.1 Run npm run build to verify TypeScript compilation
- [x] 8.2 Run npm run lint to check code style
- [ ] 8.3 Run npm run dev with --help flag to test CLI parsing
- [ ] 8.4 Verify log output format in terminal
- [ ] 8.5 Update AGENTS.md with test command if needed