## ADDED Requirements

### Requirement: Extended BotContext
The BotContext SHALL be extended to include infrastructure services (logger, db) accessible to all handlers.

#### Scenario: Logger service in context
- **WHEN** handler accesses ctx.logger
- **THEN** it SHALL return the pino logger instance
- **AND** it SHALL be available on every incoming update

#### Scenario: Database service in context
- **WHEN** handler accesses ctx.db
- **THEN** it SHALL return the pg Pool instance
- **AND** it SHALL support query operations

### Requirement: Context extension via Telegraf scene/pComposer pattern
The BotContext SHALL be extended using Telegraf's context extension mechanism.

#### Scenario: Context includes infrastructure
- **WHEN** Telegraf receives an update
- **THEN** the context SHALL contain ctx.logger and ctx.db properties
- **AND** they SHALL be ready for use in any handler