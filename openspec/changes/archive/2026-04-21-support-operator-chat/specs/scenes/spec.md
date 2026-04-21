## ADDED Requirements

### Requirement: Category selection scene
The system SHALL guide user through category selection workflow.

#### Scenario: User enters category scene
- **WHEN** user selects category from menu
- **THEN** system enters category scene and displays questions

#### Scenario: User selects question
- **WHEN** user clicks question button
- **THEN** system shows answer and exits scene

#### Scenario: User goes back
- **WHEN** user clicks "Назад"
- **THEN** system returns to category menu

### Requirement: Escalation scene
The system SHALL handle escalation to operator workflow.

#### Scenario: User requests escalation
- **WHEN** user selects "Связаться с оператором"
- **THEN** system enters escalation scene and connects to operator

#### Scenario: No operators available
- **WHEN** escalation requested and no operators available
- **THEN** system shows queue message

### Requirement: Operator chat scene
The system SHALL handle operator chat workflow.

#### Scenario: Operator receives chat
- **WHEN** operator receives new chat
- **THEN** system enters chat scene with user context

#### Scenario: Operator sends message
- **WHEN** operator sends reply
- **THEN** system delivers to user and logs

#### Scenario: End chat
- **WHEN** operator sends /end
- **THEN** system exits chat scene and marks complete