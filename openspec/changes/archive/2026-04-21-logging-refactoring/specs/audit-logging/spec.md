## ADDED Requirements

### Requirement: Audit logger captures user actions
The system SHALL provide a dedicated audit logger for tracking user actions and commands.

#### Scenario: Audit log writes user command
- **WHEN** user executes a bot command
- **THEN** the action is logged to audit log with user ID, command, timestamp

#### Scenario: Audit log writes escalation
- **WHEN** user escalates to operator
- **THEN** the escalation is logged with user ID, timestamp, and context

#### Scenario: Audit log includes user context
- **WHEN** logging user action
- **THEN** log entry includes user_id, username, and action type fields

### Requirement: Audit log uses JSON format
The system SHALL write audit logs as JSON for easy parsing and compliance.

#### Scenario: Audit log file creation
- **WHEN** LOG_AUDIT_FILE is set
- **THEN** audit logs are written as JSON lines to that file

#### Scenario: No audit logging when path not set
- **WHEN** LOG_AUDIT_FILE is not set
- **THEN** no audit logs are written (audit logger is silent)