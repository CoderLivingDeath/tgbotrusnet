## ADDED Requirements

### Requirement: Unknown command handling
The system SHALL display helpful message for unknown commands.

#### Scenario: Unknown command
- **WHEN** user sends unknown command
- **THEN** system shows "Неизвестная команда. Используйте /start для начала работы."

### Requirement: No answer found handling
The system SHALL suggest contacting operator when no answer is found.

#### Scenario: No answer in knowledge base
- **WHEN** user searches and no results found
- **THEN** system shows "Ответ не найден. Используйте /support для связи с оператором."

### Requirement: Network error handling
The system SHALL handle network errors gracefully.

#### Scenario: Network failure
- **WHEN** network error occurs
- **THEN** system logs error and shows "Произошла ошибка. Попробуйте позже."

### Requirement: Database error handling
The system SHALL handle database errors gracefully.

#### Scenario: Database error
- **WHEN** database error occurs
- **THEN** system logs error and shows "Ошибка базы данных. Обратитесь к администратору."

### Requirement: Centralized exception handling
The system SHALL log all exceptions to log file.

#### Scenario: Exception occurs
- **WHEN** unhandled exception occurs
- **THEN** system logs exception details to log file