## ADDED Requirements

### Requirement: Operator can login with password
The system SHALL authenticate operator by password and create session token.

#### Scenario: Successful operator login
- **WHEN** operator sends /operator login <password>
- **THEN** system validates password and shows session token

#### Scenario: Failed operator login
- **WHEN** operator sends /operator login with wrong password
- **THEN** system shows "Неверный пароль"

### Requirement: Operator session is protected
The system SHALL validate session token for operator actions.

#### Scenario: Access operator action without session
- **WHEN** operator sends protected command without login
- **THEN** system shows "Сначала войдите: /operator login <password>"

#### Scenario: Access operator action with invalid session
- **WHEN** operator sends command with invalid token
- **THEN** system shows "Сессия истекла или недействительна"

### Requirement: Operator can view incoming chats
The system SHALL show operator their assigned chats.

#### Scenario: View active chats
- **WHEN** operator logs in and has active chats
- **THEN** system shows inline keyboard with chat buttons

### Requirement: Operator can select chat to respond
The system SHALL allow operator to select which chat to respond to.

#### Scenario: Select chat
- **WHEN** operator clicks chat button
- **THEN** system opens chat for responding

### Requirement: Operator can set status
The system SHALL allow operator to set available/busy status.

#### Scenario: Set available
- **WHEN** operator sends /operator available
- **THEN** system marks operator as available for new chats

#### Scenario: Set busy
- **WHEN** operator sends /operator busy
- **THEN** system marks operator as busy, no new chats assigned

### Requirement: Operator can view statistics
The system SHALL show processed request statistics.

#### Scenario: View statistics
- **WHEN** operator sends /stats
- **THEN** system shows: total handled chats, resolved, average response time

### Requirement: Operator can logout
The system SHALL invalidate operator session token.

#### Scenario: Operator logout
- **WHEN** operator sends /operator logout
- **THEN** system invalidates session and confirms

### Requirement: Session expires after 24 hours
The system SHALL automatically expire operator session after 24 hours.

#### Scenario: Session expires
- **WHEN** operator attempts action after 24 hours
- **THEN** system treats as logged out