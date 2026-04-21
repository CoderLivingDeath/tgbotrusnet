## ADDED Requirements

### Requirement: Console logging uses pretty format
The system SHALL output pretty-formatted logs with colors to console when LOG_CONSOLE is enabled and platform supports it.

#### Scenario: Pretty console output on supported platform
- **WHEN** LOG_CONSOLE=true and platform is not Windows
- **THEN** logs are formatted with colors, timestamps, and readable structure

#### Scenario: No console output when disabled
- **WHEN** LOG_CONSOLE=false
- **THEN** no logs are written to stdout

### Requirement: File logging uses JSON format
The system SHALL write JSON-structured logs to the file specified by LOG_FILE.

#### Scenario: JSON log file creation
- **WHEN** LOG_FILE is set to a valid path
- **THEN** logs are written as JSON lines to that file

#### Scenario: No file logging when path not set
- **WHEN** LOG_FILE is not set or empty
- **THEN** no logs are written to file

### Requirement: Verbose mode enables debug level logging
The system SHALL enable debug-level logging when --verbose flag is provided.

#### Scenario: Verbose to console
- **WHEN** --verbose is passed
- **THEN** debug-level logs are output to console with pretty format

#### Scenario: Verbose to file
- **WHEN** --verbose is passed and LOG_VERBOSE_FILE is set
- **THEN** debug-level logs are also written to the verbose log file