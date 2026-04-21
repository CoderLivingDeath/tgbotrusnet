## ADDED Requirements

### Requirement: CLI поддерживает флаг --verbose
При запуске бота с флагом -v или --verbose включается расширенное логирование.

#### Scenario: Запуск с --verbose
- **WHEN** пользователь запускает `npm run start -- --verbose`
- **THEN** уровень логирования устанавливается в 'debug'

#### Scenario: Запуск без --verbose
- **WHEN** пользователь запускает `npm run start`
- **THEN** уровень логирования остается 'info' (по умолчанию)

### Requirement: Логирование всех команд в verbose режиме
В режиме verbose все входящие команды должны записываться в лог.

#### Scenario: Получение команды в verbose режиме
- **WHEN** бот получает команду от пользователя с verbose=true
- **THEN** команда логируется с уровнем debug включая аргументы

### Requirement: Логирование callback_query в verbose режиме
В режиме verbose callback данные должны записываться в лог.

#### Scenario: Callback query в verbose режиме
- **WHEN** пользователь нажимает inline кнопку с verbose=true
- **THEN** callback_data логируется с уровнем debug