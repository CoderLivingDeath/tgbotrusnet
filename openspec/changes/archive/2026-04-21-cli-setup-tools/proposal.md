## Why

Currently, the bot lacks CLI tooling for common DevOps tasks: configuring database connection, initializing database schema, and setting up logging. These tasks require manual editing of `.env` files and running SQL scripts, which is error-prone and not user-friendly.

## What Changes

- Add CLI commands for database configuration (set connection string, test connection)
- Add CLI commands for database initialization (create tables, seed default data)
- Add CLI commands for logging configuration (set log level, enable/disable pretty print)
- Integrate all CLI tools under a unified `bot` CLI entry point

## Capabilities

### New Capabilities
- `cli-db-config`: Configure database connection via CLI prompts or flags
- `cli-db-init`: Initialize database schema and seed default data
- `cli-log-config`: Configure logging level and output format

### Modified Capabilities
- None

## Impact

- New CLI module in `src/utils/cli.ts`
- New commands: `bot db:config`, `bot db:init`, `bot log:config`
- Config module enhanced to support dynamic reloading