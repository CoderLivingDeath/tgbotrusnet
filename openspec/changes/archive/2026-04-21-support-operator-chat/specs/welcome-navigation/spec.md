## ADDED Requirements

### Requirement: Bot shows welcome message on /start
The system SHALL display welcome message with brief bot capabilities when user sends /start command.

#### Scenario: User sends /start
- **WHEN** user sends /start command
- **THEN** system displays welcome message with inline keyboard menu

### Requirement: Welcome menu shows 4 categories
The system SHALL display inline keyboard with 4 predefined categories.

#### Scenario: Display welcome menu
- **WHEN** welcome message displayed
- **THEN** inline keyboard shows: "Восстановление доступа", "Статус заявки", "Общие вопросы", "Связаться с оператором"

### Requirement: User can select category from menu
The system SHALL handle category selection from inline keyboard.

#### Scenario: Select category
- **WHEN** user clicks category button
- **THEN** system shows questions in category

### Requirement: User can access menu via /menu
The system SHALL show menu when user sends /menu command.

#### Scenario: Menu command
- **WHEN** user sends /menu
- **THEN** system shows welcome menu with inline keyboard