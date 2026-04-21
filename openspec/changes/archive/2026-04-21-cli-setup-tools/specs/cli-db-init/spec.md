## ADDED Requirements

### Requirement: Database schema can be initialized via CLI
The CLI SHALL provide a command to create all database tables and seed initial data.

#### Scenario: Initialize empty database
- **WHEN** user runs `bot db:init` on a fresh database
- **THEN** all tables are created and default data is seeded
- **AND** the CLI displays "Database initialized successfully"

#### Scenario: Initialize database with custom schema
- **WHEN** user runs `bot db:init --schema custom.sql`
- **THEN** the CLI executes the custom SQL file instead of default schema

### Requirement: Database initialization is safe
The CLI SHALL warn the user before initializing a non-empty database.

#### Scenario: Detect non-empty database
- **WHEN** user runs `bot db:init` on a database with existing tables
- **THEN** the CLI displays a warning and exits unless --force is specified

#### Scenario: Force initialize non-empty database
- **WHEN** user runs `bot db:init --force`
- **THEN** the CLI drops existing tables and recreates them
- **AND** all data is lost (confirmed by warning message)