## Why

Current logging implementation has no differentiation between terminal and file output, lacks proper file rotation, and doesn't separate user action logs from system logs. This makes debugging difficult and log management cumbersome in production.

## What Changes

- Split logging into two destinations: console (pretty) and file (structured JSON)
- Add separate user action logger that writes to dedicated audit log file
- Configure verbose logging to output to both terminal and files based on mode
- Use JSON format for file logs (better for log aggregation tools)
- Environment-based log path configuration via .env

## Capabilities

### New Capabilities
- `multi-destination-logging`: Separate console and file loggers with different formats
- `audit-logging`: Dedicated logger for user actions (commands, messages, escalations)

### Modified Capabilities
- (none - this is an internal implementation change)

## Impact

- `src/services/logger.ts` - Refactored to support multiple log destinations
- `.env` - Add new environment variables for log configuration
- `src/utils/cli.ts` - Update log:config command for new options