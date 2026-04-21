## ADDED Requirements

### Requirement: PostgreSQL connection pool
The application SHALL establish a connection pool to PostgreSQL database for efficient query execution.

#### Scenario: Pool initialization on startup
- **WHEN** application starts
- **WHEN** it SHALL create a pg Pool instance
- **AND** it SHALL use DATABASE_URL from environment
- **AND** it SHALL log successful connection

#### Scenario: Pool uses environment credentials
- **WHEN** DATABASE_URL is provided in environment
- **THEN** the pool SHALL parse connection parameters from it
- **AND** it SHALL connect to the specified database

#### Scenario: Graceful pool shutdown
- **WHEN** application receives SIGTERM or SIGINT
- **THEN** it SHALL close all pool connections
- **AND** it SHALL log shutdown completion before exiting

### Requirement: Database service interface
The application SHALL provide a database service accessible through BotContext.

#### Scenario: DB service accessible from context
- **WHEN** handler receives ctx with database service
- **THEN** ctx.db SHALL return the pool instance
- **AND** it SHALL support query execution