## ADDED Requirements

### Requirement: User can start support chat (escalation)
The system SHALL connect user with an available operator when user requests chat via category or explicit command.

#### Scenario: Escalate to available operator
- **WHEN** user selects "Связаться с оператором" and operator is available
- **THEN** system creates chat, notifies operator, and shows "Ожидайте ответа оператора"

#### Scenario: Escalate when all operators busy
- **WHEN** user requests operator and no operators available
- **THEN** system shows "Все операторы заняты. Ваш запрос добавлен в очередь."

### Requirement: Context preserved on escalation
The system SHALL pass chat context (history, selected category, user_id) to operator.

#### Scenario: Operator sees context
- **WHEN** operator receives new chat
- **THEN** system shows: user_id, selected category, chat history summary

### Requirement: User can send message in chat
The system SHALL deliver user's message to operator in the active chat.

#### Scenario: Send message to operator
- **WHEN** user sends text message in active chat
- **THEN** system delivers message to operator

#### Scenario: Send message without active chat
- **WHEN** user sends text without active chat
- **THEN** system prompts to start chat via /support

### Requirement: User can end chat
The system SHALL allow user to end the support chat.

#### Scenario: User ends chat
- **WHEN** user sends /end in chat
- **THEN** system ends chat and notifies operator

### Requirement: Operator can view assigned chats
The system SHALL show operator their active and recent chats.

#### Scenario: View active chats
- **WHEN** operator logs in and has active chats
- **THEN** system shows inline keyboard with chat buttons

### Requirement: Operator can respond to user
The system SHALL deliver operator's response to user in chat.

#### Scenario: Send response to user
- **WHEN** operator sends reply in chat
- **THEN** system delivers message to user

### Requirement: Operator can end chat
The system SHALL allow operator to end the support chat.

#### Scenario: Operator ends chat
- **WHEN** operator sends /end in chat
- **THEN** system ends chat and notifies user

### Requirement: Operator can ban user
The system SHALL allow operator to ban user from future chats.

#### Scenario: Ban user
- **WHEN** operator sends /ban <user_id>
- **THEN** system bans user and confirms

### Requirement: Chat messages are logged
The system SHALL log all messages with timestamp, sender, and content.

#### Scenario: Log message
- **WHEN** any message is sent in chat
- **THEN** system logs: timestamp, sender_type, text, chat_id, category

### Requirement: Statistics available for admin/operator
The system SHALL show processed request statistics.

#### Scenario: View statistics
- **WHEN** admin/operator sends /stats
- **THEN** system shows: total requests, auto-responses, escalations, date range