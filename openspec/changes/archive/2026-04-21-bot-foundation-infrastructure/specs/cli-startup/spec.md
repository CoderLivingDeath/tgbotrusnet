## ADDED Requirements

### Requirement: Application supports CLI arguments
The application SHALL accept CLI arguments when launched, allowing configuration of host, port, log path, and logging format without environment variables.

#### Scenario: Default values when no arguments provided
- **WHEN** application launches without CLI arguments
- **THEN** it SHALL use default values: host=0.0.0.0, port=3000, no log file, pretty logging enabled

#### Scenario: Custom host and port
- **WHEN** application launches with `--host 127.0.0.1 --port 8080`
- **THEN** it SHALL bind to the specified host and port

#### Scenario: Log file path
- **WHEN** application launches with `--log-path /var/log/bot.log`
- **THEN** it SHALL write logs to the specified file path
- **AND** it SHALL disable pretty terminal output

#### Scenario: Pretty logging toggle
- **WHEN** application launches with `--log-pretty=false`
- **THEN** it SHALL output logs as JSON (machine-readable format)
- **AND** it SHALL NOT apply colorization or formatting