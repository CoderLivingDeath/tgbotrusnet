## Context

The Telegram bot currently requires manual configuration via `.env` files for database connection and logging settings. There's no unified CLI to:
- Set or test database connection
- Initialize database schema (create tables, seed default data)
- Configure logging preferences

Current state:
- Database connection via `DATABASE_URL` in `.env`
- Logging configured at module import time
- Schema initialization requires running `schema.ts` manually

## Goals / Non-Goals

**Goals:**
- Provide interactive CLI commands to configure database connection
- Provide CLI command to initialize database (create tables + seed)
- Provide CLI commands to configure logging level and format
- Unify all CLI tools under `bot` command entry point

**Non-Goals:**
- GUI or web interface
- Remote database management
- Configuration backup/restore
- Migration between database versions

## Decisions

### CLI Framework: Commander.js
Using `commander` for CLI parsing (already have `minimist` as dependency but commander provides better subcommand support).
- Alternative: Use `yargs` - rejected, commander is more common in Node ecosystem

### Database Configuration Storage
Store DB config in `.env` file (existing pattern). CLI will update `.env` values.
- Alternative: Use separate config file - rejected, keep single source of truth

### Database Initialization Approach
Use existing `schema.ts` service, expose via CLI wrapper. Run migrations via pg client.
- Alternative: Use separate migration tool - rejected, keep simple for now

### Logging Configuration
Update `.env` for LOG_LEVEL, use programmatic override for session only.

## Risks / Trade-offs

- **Risk**: Concurrent config updates could corrupt `.env` → Mitigation: Use atomic file writes
- **Risk**: Database init on non-empty DB → Mitigation: Warn user, require --force flag
- **Trade-off**: Interactive prompts vs flags → Favor flags for automation, prompts for initial setup