## ADDED Requirements

### Requirement: Database connection can be configured via CLI
The CLI SHALL provide a command to set or update the database connection string stored in `.env` file.

#### Scenario: Set database URL via flag
- **WHEN** user runs `bot db:config --url postgresql://user:pass@localhost:5432/db`
- **THEN** the `DATABASE_URL` value in `.env` is updated to the provided URL

#### Scenario: Set database URL interactively
- **WHEN** user runs `bot db:config` without flags and enters a URL at the prompt
- **THEN** the `DATABASE_URL` value in `.env` is updated to the entered URL

### Requirement: Database connection can be tested
The CLI SHALL provide a command to test the database connection before starting the bot.

#### Scenario: Test successful connection
- **WHEN** user runs `bot db:config --test` and DATABASE_URL is valid
- **THEN** the CLI displays "Connection successful" and exits with code 0

#### Scenario: Test failed connection
- **WHEN** user runs `bot db:config --test` and DATABASE_URL is invalid or server unreachable
- **THEN** the CLI displays an error message with details and exits with code 1