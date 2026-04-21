import * as fs from 'fs';
import * as path from 'path';

const ENV_FILE = '.env';

export interface EnvConfig {
  [key: string]: string | undefined;
}

export function readEnvFile(): EnvConfig {
  const envPath = path.resolve(process.cwd(), ENV_FILE);
  const config: EnvConfig = {};

  if (!fs.existsSync(envPath)) {
    return config;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      config[key] = value;
    }
  }

  return config;
}

export function writeEnvFile(config: EnvConfig): void {
  const envPath = path.resolve(process.cwd(), ENV_FILE);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) {
      lines.push(`${key}=${value}`);
    }
  }

  const tempPath = envPath + '.tmp';
  fs.writeFileSync(tempPath, lines.join('\n') + '\n', 'utf-8');
  fs.renameSync(tempPath, envPath);
}

export function getEnvValue(key: string): string | undefined {
  const config = readEnvFile();
  return config[key];
}

export function setEnvValue(key: string, value: string): void {
  const config = readEnvFile();
  config[key] = value;
  writeEnvFile(config);
}

export function setMultipleEnvValues(values: Record<string, string>): void {
  const config = readEnvFile();
  for (const [key, value] of Object.entries(values)) {
    config[key] = value;
  }
  writeEnvFile(config);
}

export function envFileExists(): boolean {
  const envPath = path.resolve(process.cwd(), ENV_FILE);
  return fs.existsSync(envPath);
}

export function createEnvFile(): void {
  const envPath = path.resolve(process.cwd(), ENV_FILE);
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '', 'utf-8');
  }
}