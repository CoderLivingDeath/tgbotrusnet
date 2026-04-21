## ADDED Requirements

### Requirement: Admin can login with password
The system SHALL authenticate admin by password and create session token.

#### Scenario: Successful admin login
- **WHEN** admin sends /admin login <password>
- **THEN** system validates password and shows session token

#### Scenario: Failed admin login
- **WHEN** admin sends /admin login with wrong password
- **THEN** system shows "Неверный пароль"

### Requirement: Admin session is protected
The system SHALL validate session token for admin actions.

#### Scenario: Access admin action without session
- **WHEN** admin sends protected command without login
- **THEN** system shows "Сначала войдите: /admin login <password>"

#### Scenario: Access admin action with invalid session
- **WHEN** admin sends command with invalid token
- **THEN** system shows "Сессия истекла или недействительна"

### Requirement: Admin can manage operators
The system SHALL allow admin to add and remove operators.

#### Scenario: Add operator
- **WHEN** admin sends /admin add-operator <user_id> <password>
- **THEN** system adds operator and confirms

#### Scenario: Remove operator
- **WHEN** admin sends /admin remove-operator <user_id>
- **THEN** system removes operator and confirms

### Requirement: Admin can view operators
The system SHALL list all operators with their status.

#### Scenario: List operators
- **WHEN** admin sends /admin list-operators
- **THEN** system shows list of operators with online status

### Requirement: Admin can view statistics
The system SHALL display processed request statistics.

#### Scenario: View statistics
- **WHEN** admin sends /admin stats
- **THEN** system shows: total requests, auto-responses, escalations, avg response time

### Requirement: Admin can logout
The system SHALL invalidate admin session token.

#### Scenario: Admin logout
- **WHEN** admin sends /admin logout
- **THEN** system invalidates session and confirms

### Requirement: Session expires after 24 hours
The system SHALL automatically expire admin session after 24 hours.

#### Scenario: Session expires
- **WHEN** admin attempts action after 24 hours
- **THEN** system treats as logged out