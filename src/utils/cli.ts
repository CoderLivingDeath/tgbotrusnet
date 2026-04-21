import minimist from "minimist";

export interface CLIArgs {
  host: string;
  port: number;
  logPath: string | false;
  logPretty: boolean;
  help: boolean;
}

const DEFAULTS: CLIArgs = {
  host: "0.0.0.0",
  port: 3000,
  logPath: false,
  logPretty: true,
  help: false,
};

export function parseArgs(args: string[] = process.argv.slice(2)): CLIArgs {
  const parsed = minimist(args);

  return {
    host: parsed.host ?? DEFAULTS.host,
    port: Number(parsed.port ?? DEFAULTS.port),
    logPath: parsed["log-path"] ?? DEFAULTS.logPath,
    logPretty: parsed["log-pretty"] !== undefined
      ? parsed["log-pretty"] !== "false"
      : DEFAULTS.logPretty,
    help: parsed.help ?? DEFAULTS.help,
  };
}

export function showHelp(): void {
  console.log(`
Usage: bot [OPTIONS]

Options:
  --host <address>       Host to bind to (default: 0.0.0.0)
  --port <number>        Port to bind to (default: 3000)
  --log-path <path>      Log file path (default: no file logging)
  --log-pretty <bool>   Enable pretty output (default: true)
  --help                Show this help message
`);
}