## ADDED Requirements

### Requirement: Logger uses proper ES imports
The logger module SHALL NOT use `require()` for importing pino-pretty.

#### Scenario: No require calls for pino-pretty
- **WHEN** ESLint runs on logger.ts
- **THEN** no `@typescript-eslint/no-require-imports` errors should be present