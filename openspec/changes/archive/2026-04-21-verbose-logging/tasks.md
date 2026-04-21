## 1. CLI изменения

- [x] 1.1 Добавить поле `verbose` в интерфейс CLIArgs
- [x] 1.2 Добавить обработку флага `-v, --verbose` в parseArgs
- [x] 1.3 Обновить showHelp с информацией о --verbose

## 2. Logger изменения

- [x] 2.1 Модифицировать createLogger для приема параметра verbose
- [x] 2.2 Устанавливать уровень 'debug' при verbose=true

## 3. Интеграция

- [x] 3.1 Передать verbose в main() из parseArgs
- [x] 3.2 Передать verbose в createLogger
- [x] 3.3 Добавить middleware для логирования команд при verbose

## 4. Тестирование

- [x] 4.1 Протестировать запуск с --verbose
- [x] 4.2 Протестировать запуск без --verbose
- [x] 4.3 Проверить что логирование команд работает