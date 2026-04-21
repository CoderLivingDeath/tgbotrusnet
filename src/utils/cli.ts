import { Command } from 'commander';
import minimist from 'minimist';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { Pool } from 'pg';

export interface CLIArgs {
  host: string;
  port: number;
  logPath: string | false;
  logPretty: boolean;
  help: boolean;
  verbose: boolean;
}

const DEFAULTS: CLIArgs = {
  host: '0.0.0.0',
  port: 3000,
  logPath: false,
  logPretty: true,
  help: false,
  verbose: false,
};

export function parseArgs(args: string[] = process.argv.slice(2)): CLIArgs {
  const parsed = minimist(args);

  return {
    host: parsed.host ?? DEFAULTS.host,
    port: Number(parsed.port ?? DEFAULTS.port),
    logPath: parsed['log-path'] ?? DEFAULTS.logPath,
    logPretty:
      parsed['log-pretty'] !== undefined
        ? parsed['log-pretty'] !== 'false'
        : DEFAULTS.logPretty,
    help: parsed.help ?? DEFAULTS.help,
    verbose: parsed.verbose ?? parsed.v ?? DEFAULTS.verbose,
  };
}

export function showHelp(): void {
  console.log(`
Usage: bot [OPTIONS]
       bot db:config [OPTIONS]
       bot db:init [OPTIONS]
       bot log:config [OPTIONS]

Options:
  --host <address>       Host to bind to (default: 0.0.0.0)
  --port <number>        Port to bind to (default: 3000)
  --log-path <path>      Log file path (default: no file logging)
  --log-pretty <bool>   Enable pretty output (default: true)
  -v, --verbose         Enable verbose logging (debug level)
  --help                Show this help message

Database Commands:
  bot db:config --url <url>      Set database URL
  bot db:config --test           Test database connection
  bot db:init                    Initialize database
  bot db:init --force            Force reinitialize database
  bot db:init --schema <file>    Use custom schema file

Logging Commands:
  bot log:config --level <level>  Set log level (debug, info, warn, error)
  bot log:config --pretty         Enable pretty print
  bot log:config --no-pretty      Disable pretty print
  bot log:config --show           Show current config
`);
}

const ENV_FILE = '.env';

interface EnvConfig {
  [key: string]: string | undefined;
}

function readEnvFile(): EnvConfig {
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

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      config[key] = value;
    }
  }

  return config;
}

function writeEnvFile(config: EnvConfig): void {
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

function getEnvValue(key: string): string | undefined {
  const config = readEnvFile();
  return config[key];
}

function setEnvValue(key: string, value: string): void {
  const config = readEnvFile();
  config[key] = value;
  writeEnvFile(config);
}

interface ParsedConnectionString {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

function parseConnectionString(url: string): ParsedConnectionString {
  const match = url.match(
    /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/
  );
  if (!match) {
    throw new Error(`Invalid connection string: ${url}`);
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

const program = new Command();

program
  .name('bot')
  .description('Telegram bot CLI tools for configuration and setup')
  .version('1.0.0');

program
  .command('db:config')
  .description('Configure database connection')
  .option('-u, --url <url>', 'Database connection URL')
  .option('-t, --test', 'Test database connection')
  .action(async (options) => {
    if (options.test) {
      await testDbConnection();
      return;
    }

    if (options.url) {
      setEnvValue('DATABASE_URL', options.url);
      console.log('Database URL updated successfully');
      return;
    }

    console.log('Enter database URL (or press Enter to keep current):');
    const currentUrl = getEnvValue('DATABASE_URL') || '';
    console.log(`Current: ${currentUrl}`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('New value: ', (answer: string) => {
      rl.close();
      if (answer.trim()) {
        setEnvValue('DATABASE_URL', answer.trim());
        console.log('Database URL updated successfully');
      } else {
        console.log('No change made');
      }
    });
  });

program
  .command('db:init')
  .description('Initialize database schema')
  .option('-s, --schema <file>', 'Custom SQL schema file')
  .option('-f, --force', 'Force reinitialize (drops existing tables)')
  .option('-d, --database <name>', 'Database name (creates if not exists)')
  .action(async (options) => {
    await initializeDatabase(options.schema, options.force, options.database);
  });

program
  .command('log:config')
  .description('Configure logging settings')
  .option('-l, --level <level>', 'Log level (debug, info, warn, error)')
  .option('--pretty', 'Enable pretty print logging')
  .option('--no-pretty', 'Disable pretty print logging')
  .option('-s, --show', 'Show current logging configuration')
  .action((options) => {
    if (options.show) {
      showLogConfig();
      return;
    }

    if (options.level) {
      const validLevels = ['debug', 'info', 'warn', 'error'];
      if (!validLevels.includes(options.level.toLowerCase())) {
        console.error(
          `Invalid log level: ${options.level}. Valid: ${validLevels.join(', ')}`
        );
        process.exit(1);
      }
      setEnvValue('LOG_LEVEL', options.level.toLowerCase());
      console.log(`Log level set to: ${options.level.toLowerCase()}`);
    }

    if (options.pretty !== undefined) {
      setEnvValue('LOG_PRETTY', options.pretty ? 'true' : 'false');
      console.log(`Pretty print ${options.pretty ? 'enabled' : 'disabled'}`);
    }

    if (!options.level && options.pretty === undefined) {
      interactiveLogConfig();
    }
  });

async function testDbConnection(): Promise<void> {
  const url = getEnvValue('DATABASE_URL');
  if (!url) {
    console.error(
      'DATABASE_URL not set. Run "bot db:config --url <url>" first.'
    );
    process.exit(1);
  }

  try {
    const pool = new Pool({ connectionString: url });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
    console.log('Connection successful');
    process.exit(0);
  } catch (error) {
    console.error(
      'Connection failed:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

async function initializeDatabase(
  schemaFile?: string,
  force?: boolean,
  dbName?: string
): Promise<void> {
  const baseUrl = getEnvValue('DATABASE_URL');
  if (!baseUrl) {
    console.error(
      'DATABASE_URL not set. Run "bot db:config --url <url>" first.'
    );
    process.exit(1);
  }

  const parsedUrl = parseConnectionString(baseUrl);
  const targetDbName = dbName || getEnvValue('DATABASE_NAME') || parsedUrl.database || 'postgres';

  const adminUrl = `postgresql://${parsedUrl.user}:${parsedUrl.password}@${parsedUrl.host}:${parsedUrl.port}/postgres`;
  const adminPool = new Pool({ connectionString: adminUrl });

  interface DbError extends Error {
  code?: string;
}

  try {
    await adminPool.query(`CREATE DATABASE ${targetDbName}`);
    console.log(`Database "${targetDbName}" created`);
  } catch (e) {
    const err = e as DbError;
    if (!err.message.includes('already exists') && err.code !== '42P04') {
      throw e;
    }
  }
  await adminPool.end();

  const targetUrl = `postgresql://${parsedUrl.user}:${parsedUrl.password}@${parsedUrl.host}:${parsedUrl.port}/${targetDbName}`;
  setEnvValue('DATABASE_URL', targetUrl);
  setEnvValue('DATABASE_NAME', targetDbName);

  const pool = new Pool({ connectionString: targetUrl });

  try {
    const client = await pool.connect();

    const checkResult = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const hasTables = checkResult.rows.length > 0;

    if (hasTables && !force) {
      console.warn(
        'Database already has tables. Use --force to drop and recreate.'
      );
      client.release();
      await pool.end();
      process.exit(1);
    }

    if (hasTables && force) {
      console.warn('Force flag set - dropping existing tables...');
      await client.query('DROP TABLE IF EXISTS operators CASCADE');
      await client.query('DROP TABLE IF EXISTS sessions CASCADE');
      await client.query('DROP TABLE IF EXISTS request_logs CASCADE');
      await client.query('DROP TABLE IF EXISTS chats CASCADE');
      await client.query('DROP TABLE IF EXISTS faqs CASCADE');
      await client.query('DROP TABLE IF EXISTS categories CASCADE');
      await client.query('DROP TABLE IF EXISTS banned_users CASCADE');
    }

    if (schemaFile) {
      const customSchema = fs.readFileSync(schemaFile, 'utf-8');
      await client.query(customSchema);
      console.log('Custom schema applied successfully');
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS faqs (
          id SERIAL PRIMARY KEY,
          category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS operators (
          id SERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'offline',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
          token VARCHAR(255) PRIMARY KEY,
          user_id BIGINT NOT NULL,
          role VARCHAR(50) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS request_logs (
          id SERIAL PRIMARY KEY,
          user_id BIGINT,
          message TEXT,
          handler VARCHAR(100),
          response TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          operator_id INTEGER REFERENCES operators(id),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS banned_users (
          id SERIAL PRIMARY KEY,
          user_id BIGINT UNIQUE NOT NULL,
          reason TEXT,
          banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          banned_by BIGINT
        );
      `);

      await client.query(`
        INSERT INTO categories (name, description) VALUES 
          ('Восстановление доступа', 'Вопросы о восстановлении доступа к аккаунту'),
          ('Статус заявки', 'Вопросы о статусе обработки заявки'),
          ('Общие вопросы', 'Общие вопросы о сервисе'),
          ('Связаться с оператором', 'Запрос на связь с оператором')
        ON CONFLICT (name) DO NOTHING
      `);

      console.log('Database initialized successfully');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error(
      'Database initialization failed:',
      error instanceof Error ? error.message : error
    );
    await pool.end();
    process.exit(1);
  }
}

function showLogConfig(): void {
  const level = getEnvValue('LOG_LEVEL') || 'info';
  const pretty = getEnvValue('LOG_PRETTY') || 'true';
  console.log('Current logging configuration:');
  console.log(`  LOG_LEVEL: ${level}`);
  console.log(`  LOG_PRETTY: ${pretty}`);
}

function interactiveLogConfig(): void {
  const currentLevel = getEnvValue('LOG_LEVEL') || 'info';
  const currentPretty = getEnvValue('LOG_PRETTY') || 'true';

  console.log('Current settings:');
  console.log(`  Log level: ${currentLevel}`);
  console.log(`  Pretty print: ${currentPretty}`);
  console.log('\nAvailable log levels: debug, info, warn, error');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    '\nEnter log level (or press Enter to keep current): ',
    (answer: string) => {
      const level = answer.trim().toLowerCase();
      if (level && ['debug', 'info', 'warn', 'error'].includes(level)) {
        setEnvValue('LOG_LEVEL', level);
        console.log(`Log level set to: ${level}`);
      }

      rl.question(
        'Enable pretty print? (y/n, or press Enter to keep current): ',
        (prettyAnswer: string) => {
          rl.close();
          if (prettyAnswer.trim()) {
            const pretty = prettyAnswer.toLowerCase().startsWith('y');
            setEnvValue('LOG_PRETTY', pretty ? 'true' : 'false');
            console.log(`Pretty print ${pretty ? 'enabled' : 'disabled'}`);
          }
        }
      );
    }
  );
}

const args = process.argv.slice(2);
if (args.length === 0 || !args[0].includes(':')) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    showHelp();
    process.exit(0);
  }
}

if (require.main === module) {
  program.parse(process.argv);
}