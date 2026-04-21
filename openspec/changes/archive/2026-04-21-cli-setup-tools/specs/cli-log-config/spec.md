## ADDED Requirements

### Requirement: Logging level can be configured via CLI
The CLI SHALL provide a command to set the logging level stored in `.env` file.

#### Scenario: Set log level via flag
- **WHEN** user runs `bot log:config --level debug`
- **THEN** the `LOG_LEVEL` value in `.env` is updated to "debug"

#### Scenario: Set log level interactively
- **WHEN** user runs `bot log:config` without flags and selects a level
- **THEN** the `LOG_LEVEL` value in `.env` is updated to the selected level

### Requirement: Pretty print logging can be toggled
The CLI SHALL provide a command to enable or disable pretty-printed logs.

#### Scenario: Enable pretty print
- **WHEN** user runs `bot log:config --pretty`
- **THEN** the `LOG_PRETTY` value in `.env` is set to "true"

#### Scenario: Disable pretty print
- **WHEN** user runs `bot log:config --no-pretty`
- **THEN** the `LOG_PRETTY` value in `.env` is set to "false"

### Requirement: Logging configuration can be viewed
The CLI SHALL provide a command to display current logging settings.

#### Scenario: View current config
- **WHEN** user runs `bot log:config --show`
- **THEN** the current LOG_LEVEL and LOG_PRETTY values are displayed