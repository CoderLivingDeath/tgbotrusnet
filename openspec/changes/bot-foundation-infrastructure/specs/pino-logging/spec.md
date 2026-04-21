## ADDED Requirements

### Requirement: Structured logging with pino
The application SHALL use pino for logging to ensure high-performance structured logging with consistent output format.

#### Scenario: Logger initialization at startup
- **WHEN** application initializes
- **WHEN** it SHALL create a pino logger instance
- **AND** it SHALL configure log level from environment or default to 'info'

#### Scenario: Pretty output in development
- **WHEN** --log-pretty flag is provided or not writing to file
- **THEN** it SHALL use pino-pretty for human-readable colored output
- **AND** it SHALL include timestamp, level, and message

#### Scenario: JSON output for file logging
- **WHEN** --log-path is specified
- **THEN** it SHALL output logs as JSON lines
- **AND** each log entry SHALL include timestamp, level, message fields

### Requirement: Log levels
The application SHALL support standard log levels: error, warn, info, debug.

#### Scenario: Info level logs visible by default
- **WHEN** application logs at info level
- **THEN** it SHALL appear in output
- **AND** it SHALL include caller context (file:line)