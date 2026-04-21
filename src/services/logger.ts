import pino, { DestinationStream } from "pino";
import * as fs from "fs";
import * as path from "path";
import type { CLIArgs } from "../utils/cli";
import { getEnvValue } from "../utils/config-helper";

/**
 * Logger type alias for pino Logger instances.
 */
export type Logger = pino.Logger;

/**
 * Ensures the directory for the log file exists, creating it if necessary.
 * @param logFilePath - The full path to the log file
 */
function ensureLogDir(logFilePath: string): void {
  const dir = path.dirname(logFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Extracts log settings from CLI arguments and environment variables.
 * @param config - CLI arguments configuration
 * @returns Object containing log level, console enabled flag, file paths
 */
function getLogSettings(config: CLIArgs): {
  level: string;
  consoleEnabled: boolean;
  filePath: string | undefined;
  verboseFilePath: string | undefined;
} {
  let level = getEnvValue("LOG_LEVEL") ?? "info";

  if (config.verbose) {
    level = "debug";
  }

  const consoleEnabled = getEnvValue("LOG_CONSOLE") !== "false";
  const filePath = getEnvValue("LOG_FILE") || undefined;
  const verboseFilePath = config.verbose ? getEnvValue("LOG_VERBOSE_FILE") || undefined : undefined;

  return { level, consoleEnabled, filePath, verboseFilePath };
}

/**
 * Creates a pretty-printed stream for console logging.
 * @returns A promise that resolves to a pino DestinationStream
 */
async function createPrettyStream(): Promise<DestinationStream> {
  const pretty = (await import("pino-pretty")).default;
  return pretty({
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
  });
}

/**
 * Creates and configures a logger instance based on CLI arguments and environment variables.
 * Supports console output, file logging, and verbose (debug) logging.
 * @param config - CLI arguments containing host, port, verbose, and other options
 * @returns A configured pino Logger instance
 */
export async function createLogger(config: CLIArgs): Promise<Logger> {
  const { level, consoleEnabled, filePath, verboseFilePath } = getLogSettings(config);

  const hasFile = !!filePath;
  const hasVerbose = !!verboseFilePath;

  // Only console, no files
  if (consoleEnabled && !hasFile && !hasVerbose) {
    return pino({
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    });
  }

  // Build streams array for multistream
  const streams: pino.StreamEntry[] = [];

  // Console stream with pretty formatting
  if (consoleEnabled) {
    streams.push({
      stream: await createPrettyStream(),
      level: level as pino.Level,
    });
  }

  // File streams - use sync: true and minLength: 0 for immediate writes
  if (filePath) {
    ensureLogDir(filePath);
    streams.push({
      stream: pino.destination({ dest: filePath, sync: true, minLength: 0 }),
      level: "info",
    });
  }

  if (verboseFilePath) {
    ensureLogDir(verboseFilePath);
    streams.push({
      stream: pino.destination({ dest: verboseFilePath, sync: true, minLength: 0 }),
      level: "debug",
    });
  }

  if (streams.length === 0) {
    return pino({ level });
  }

  // Use multistream with pretty stream and file destinations
  return pino({ level: "debug" }, pino.multistream(streams));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auditLoggerInstance: any = null;

/**
 * Creates or returns a singleton audit logger instance.
 * The audit logger writes to LOG_AUDIT_FILE and uses a custom "audit" log level.
 * @returns A pino Logger instance with audit level, or null if LOG_AUDIT_FILE is not set
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuditLogger(): any {
  const auditFilePath = getEnvValue("LOG_AUDIT_FILE");

  if (!auditFilePath) {
    return null;
  }

  if (auditLoggerInstance) {
    return auditLoggerInstance;
  }

  ensureLogDir(auditFilePath);

  auditLoggerInstance = pino(
    {
      level: "audit",
      customLevels: {
        audit: 35,
      },
      useOnlyCustomLevels: true,
    },
    pino.destination({ dest: auditFilePath, sync: true, minLength: 0 })
  );

  return auditLoggerInstance;
}

/**
 * Logs a user action to the audit logger if configured.
 * @param action - The action name (e.g., "user_login", "chat_started")
 * @param userId - The ID of the user performing the action
 * @param metadata - Optional additional metadata to log with the action
 */
export function logUserAction(
  action: string,
  userId: number,
  metadata?: Record<string, unknown>
): void {
  const auditLogger = createAuditLogger();
  if (auditLogger) {
    (auditLogger as pino.Logger & { audit: (obj: unknown) => void }).audit({
      action,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }
}