## ADDED Requirements

### Requirement: Bot shows welcome message and navigation menu
The system SHALL display welcome message with bot capabilities and inline keyboard menu when user sends /start command.

#### Scenario: User sends /start
- **WHEN** user sends /start command
- **THEN** system displays welcome message with inline keyboard: "Восстановление доступа", "Статус заявки", "Общие вопросы", "Связаться с оператором"

### Requirement: User can select category from menu
The system SHALL display predefined categories as inline keyboard buttons.

#### Scenario: Display category menu
- **WHEN** user clicks menu button or sends menu command
- **THEN** system shows inline keyboard with categories

### Requirement: User can view FAQ questions in category
The system SHALL show questions for selected category as inline keyboard buttons.

#### Scenario: Show questions in category
- **WHEN** user clicks category button
- **THEN** system shows inline keyboard with question buttons

### Requirement: User can view answer to question
The system SHALL display the full answer when user clicks a question button.

#### Scenario: Display answer
- **WHEN** user clicks question button
- **THEN** system shows answer text with back button

### Requirement: User can search FAQs
The system SHALL allow searching FAQs by keyword in question or answer text.

#### Scenario: Search FAQ by keyword
- **WHEN** user sends /search <keyword>
- **THEN** system shows matching results as inline keyboard

#### Scenario: No search results
- **WHEN** user sends /search with no matches
- **THEN** system shows "По вашему запросу ничего не найдено"

### Requirement: User can request operator contact
The system SHALL initiate escalation to operator when user selects "Связаться с оператором" or explicitly requests.

#### Scenario: Request operator
- **WHEN** user selects "Связаться с оператором"
- **THEN** system starts chat with available operator

### Requirement: System handles unknown commands
The system SHALL show helpful message for unknown commands.

#### Scenario: Unknown command
- **WHEN** user sends unknown command
- **THEN** system shows "Неизвестная команда. Используйте /start для начала работы."

### Requirement: Admin can manage FAQ categories
The system SHALL allow admin to create, edit, and delete FAQ categories.

#### Scenario: Create category
- **WHEN** admin sends /admin create-category <name>
- **THEN** system creates category and confirms

#### Scenario: Delete category
- **WHEN** admin sends /admin delete-category <id>
- **THEN** system deletes category and all its questions

### Requirement: Admin can manage FAQs
The system SHALL allow admin to create, edit, and delete FAQs.

#### Scenario: Create FAQ
- **WHEN** admin sends /admin add-faq <category_id> <question> <answer>
- **THEN** system creates FAQ and confirms

#### Scenario: Delete FAQ
- **WHEN** admin sends /admin delete-faq <id>
- **THEN** system deletes FAQ and confirms