import { createLogger } from "../logger";

describe("Logger Service", () => {
  it("should create a logger with default configuration", () => {
    const logger = createLogger({
      host: "0.0.0.0",
      port: 3000,
      logPath: false,
      logPretty: false,
      help: false,
      verbose: false,
    });

    expect(logger).toBeDefined();
    expect(logger.level).toBe("info");
  });

  it("should create a logger with custom level", () => {
    const originalLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "debug";

    const logger = createLogger({
      host: "0.0.0.0",
      port: 3000,
      logPath: false,
      logPretty: false,
      help: false,
      verbose: false,
    });

    expect(logger.level).toBe("debug");

    if (originalLevel !== undefined) {
      process.env.LOG_LEVEL = originalLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  it("should create a logger with debug level when verbose is true", () => {
    const logger = createLogger({
      host: "0.0.0.0",
      port: 3000,
      logPath: false,
      logPretty: false,
      help: false,
      verbose: true,
    });

    expect(logger.level).toBe("debug");
  });
});