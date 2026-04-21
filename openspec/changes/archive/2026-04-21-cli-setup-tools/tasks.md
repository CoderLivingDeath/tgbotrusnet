## 1. CLI Infrastructure Setup

- [x] 1.1 Install commander package for CLI parsing
- [x] 1.2 Create src/utils/cli.ts with main CLI entry point
- [x] 1.3 Add "bot" CLI script to package.json
- [x] 1.4 Create basic command structure (db:config, db:init, log:config subcommands)

## 2. Database Configuration Command (db:config)

- [x] 2.1 Implement --url flag to set DATABASE_URL in .env
- [x] 2.2 Implement interactive prompt for DATABASE_URL
- [x] 2.3 Implement --test flag to test database connection
- [x] 2.4 Add error handling for invalid connection strings

## 3. Database Init Command (db:init)

- [x] 3.1 Integrate existing schema.ts service with CLI
- [x] 3.2 Implement --schema flag for custom SQL files
- [x] 3.3 Implement detection of existing tables (non-empty DB)
- [x] 3.4 Implement --force flag to drop and recreate tables
- [x] 3.5 Add success/failure messages

## 4. Logging Configuration Command (log:config)

- [x] 4.1 Implement --level flag to set LOG_LEVEL (debug, info, warn, error)
- [x] 4.2 Implement interactive prompt for log level selection
- [x] 4.3 Implement --pretty / --no-pretty flags for LOG_PRETTY
- [x] 4.4 Implement --show flag to display current config

## 5. Configuration Helper Module

- [x] 5.1 Create src/utils/config-helper.ts for .env file operations
- [x] 5.2 Implement read/write .env file functions
- [x] 5.3 Implement atomic file writes to prevent corruption

## 6. Testing & Validation

- [x] 6.1 Run npm run build to verify compilation
- [x] 6.2 Run npm run lint to verify code quality
- [x] 6.3 Run npm test to verify tests pass
- [x] 6.4 Test all CLI commands manually