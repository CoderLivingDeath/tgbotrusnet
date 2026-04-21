## Context

Current implementation uses pino with single-destination logging. When LOG_PATH is set, all logs go to that file with pretty formatting disabled. There's no separation between system logs and user action audit logs, and verbose mode is limited to console output only.

## Goals / Non-Goals

**Goals:**
- Pretty-printed colored logs to console (when not on Windows)
- JSON-structured logs to file for log aggregation
- Separate audit log for user actions (commands, escalations, messages)
- Verbose logs to both console and files
- Environment variable configuration for all log paths

**Non-Goals:**
- Log rotation (use external tools like logrotate)
- Log compression
- Remote log shipping (e.g., to ELK, CloudWatch)

## Decisions

1. **Use pino multistream for dual output**: Create single logger with transport that writes to multiple destinations (console + file). Each stream can have different formatting.

2. **Separate audit logger instance**: Create dedicated `createAuditLogger()` for user actions that writes to audit.log with JSON format. This simplifies filtering and compliance requirements.

3. **Environment variables**:
   - `LOG_CONSOLE`: Enable/disable console logging (default: true on non-Windows)
   - `LOG_FILE`: Main log file path (default: logs/bot.log)
   - `LOG_AUDIT_FILE`: Audit log file path (default: logs/audit.log)
   - `LOG_VERBOSE_FILE`: Verbose log file path (default: logs/debug.log)

4. **Format strategy**:
   - Console: pino-pretty with colorize (when enabled)
   - File: JSON.stringify for structured logging
   - Audit: JSON with user context fields

## Risks / Trade-offs

- **Risk**: File descriptor exhaustion with multiple log files → Mitigation: Use single logger with multistream, proper close handling
- **Risk**: Disk space with unbounded log growth → Mitigation: Document external rotation requirement, keep logs small by default
- **Trade-off**: More complex logger setup vs. simple single-file logging → Gain: Better debugging and audit capabilities justify complexity