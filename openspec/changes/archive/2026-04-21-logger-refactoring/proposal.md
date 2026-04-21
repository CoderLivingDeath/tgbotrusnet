## Why

Current logger implementation uses `require("pino-pretty")` to create pretty streams for multistream, which causes lint errors and is not idiomatic. The code needs refactoring to use proper ES imports and simplify the logger creation logic.

## What Changes

- Replace `require("pino-pretty")` with dynamic import to avoid lint errors
- Simplify logger creation by removing duplicate pretty stream creation
- Add proper TypeScript types for pino-pretty stream
- Use environment variable check instead of config for console enabled

## Capabilities

### New Capabilities
- (none - internal refactoring)

### Modified Capabilities
- `multi-destination-logging`: Refactored implementation with proper imports
- `audit-logging`: No changes needed

## Impact

- `src/services/logger.ts` - Refactor to use dynamic import for pino-pretty
- Minor cleanup of unused code