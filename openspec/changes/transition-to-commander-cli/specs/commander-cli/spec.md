## ADDED Requirements

### Requirement: CLI uses Commander.js exclusively
The CLI module SHALL use Commander.js for all argument parsing, removing the minimist dependency.

#### Scenario: Help command displays auto-generated help
- **WHEN** user runs `bot --help`
- **THEN** Commander displays auto-generated help with all available commands and options

#### Scenario: Subcommand help displays specific command options
- **WHEN** user runs `bot db:config --help`
- **THEN** Commander displays help for the db:config command with its options

### Requirement: Global options apply to all commands
Global options defined at program level SHALL be available to all subcommands.

#### Scenario: Verbose global option works with subcommand
- **WHEN** user runs `bot --verbose db:config --test`
- **THEN** verbose logging is enabled for the db:config --test execution

#### Scenario: Help global option works with subcommand
- **WHEN** user runs `bot --help db:init`
- **THEN** help for db:init command is displayed

### Requirement: CLI exits gracefully on help and errors
The CLI SHALL use Commander's exit handling to properly manage --help and invalid commands.

#### Scenario: Help flag exits with code 0
- **WHEN** user runs `bot --help`
- **THEN** program exits with code 0

#### Scenario: Invalid command shows error and exits with non-zero code
- **WHEN** user runs `bot invalid-command`
- **THEN** error message is shown and program exits with non-zero code

### Requirement: parseArgs function returns parsed options
The parseArgs function SHALL return CLIArgs with all options parsed by Commander.

#### Scenario: ParseArgs extracts host option
- **WHEN** parseArgs is called with `['--host', '127.0.0.1']`
- **THEN** returned object has host set to '127.0.0.1'

#### Scenario: ParseArgs extracts verbose flag
- **WHEN** parseArgs is called with `['--verbose']`
- **THEN** returned object has verbose set to true

#### Scenario: ParseArgs extracts log-path option
- **WHEN** parseArgs is called with `['--log-path', 'logs/app.log']`
- **THEN** returned object has logPath set to 'logs/app.log'