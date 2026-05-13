import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { Pool } from 'pg';
import { getEnvValue, setEnvValue } from './config-helper';
import { simpleHash } from '../handlers/admin/session';

/**
 * CLI arguments interface for bot startup options.
 */
export interface CLIArgs {
  host: string;
  port: number;
  logPath: string | false;
  logPretty: boolean;
  help: boolean;
  verbose: boolean;
  debug: boolean;
}

const DEFAULTS: CLIArgs = {
  host: '0.0.0.0',
  port: 3000,
  logPath: false,
  logPretty: true,
  help: false,
  verbose: false,
  debug: false,
};

/**
 * Parses command line arguments for the bot.
 * @param args - Optional array of arguments (defaults to process.argv)
 * @returns CLIArgs object with parsed values
 */
export function parseArgs(args: string[] = process.argv.slice(2)): CLIArgs {
  const hostIndex = args.indexOf('--host');
  const portIndex = args.indexOf('--port');
  const logPathIndex = args.indexOf('--log-path');
  const logPrettyIndex = args.indexOf('--log-pretty');
  const verboseIndex = args.findIndex((a) => a === '-v' || a === '--verbose');
  const helpIndex = args.findIndex((a) => a === '-h' || a === '--help');
  const debugIndex = args.findIndex((a) => a === '-d' || a === '--debug');

  return {
    host: hostIndex >= 0 && args[hostIndex + 1] ? args[hostIndex + 1] : DEFAULTS.host,
    port: portIndex >= 0 && args[portIndex + 1] ? Number(args[portIndex + 1]) : DEFAULTS.port,
    logPath: logPathIndex >= 0 && args[logPathIndex + 1] ? args[logPathIndex + 1] : DEFAULTS.logPath,
    logPretty: logPrettyIndex >= 0 
      ? args[logPrettyIndex + 1] !== 'false' 
      : DEFAULTS.logPretty,
    help: helpIndex >= 0,
    verbose: verboseIndex >= 0,
    debug: debugIndex >= 0,
  };
}

export function createProgram(): Command {
  const prog = new Command();

  prog
    .name('bot')
    .description('Telegram bot CLI tools for configuration and setup')
    .version('1.0.0')
    .exitOverride()
    .configureOutput({
      writeErr: (str) => console.error(str),
    })
    .option('-h, --help', 'Display help')
    .option('--host <address>', 'Host to bind to', DEFAULTS.host)
    .option('--port <number>', 'Port to bind to', String(DEFAULTS.port))
    .option('--log-path <path>', 'Log file path')
    .option('--log-pretty <bool>', 'Enable pretty output')
    .option('-v, --verbose', 'Enable verbose logging (debug level)')
    .option('-d, --debug', 'Enable debug mode (extra commands for testing)');

  prog
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

  prog
    .command('db:init')
    .description('Initialize database schema')
    .option('-s, --schema <file>', 'Custom SQL schema file')
    .option('-f, --force', 'Force reinitialize (drops existing tables)')
    .option('-d, --database <name>', 'Database name (creates if not exists)')
    .action(async (options) => {
      await initializeDatabase(options.schema, options.force, options.database);
    });

  prog
    .command('admin:create')
    .description('Create an admin user')
    .option('-i, --telegram-id <id>', 'Telegram user ID')
    .option('-p, --password <password>', 'Admin password')
    .action(async (options) => {
      await createAdmin(options.telegramId, options.password);
    });

  prog
    .command('log:config')
    .description('Configure logging settings')
    .option('-l, --level <level>', 'Log level (debug, info, warn, error)')
    .option('-p, --path <path>', 'Log file path')
    .option('-c, --console <bool>', 'Enable console logging (true/false)')
    .option('-a, --audit-file <path>', 'Audit log file path')
    .option('-v, --verbose-file <path>', 'Verbose log file path')
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

      if (options.path) {
        setEnvValue('LOG_FILE', options.path);
        console.log(`Log file set to: ${options.path}`);
      }

      if (options.console !== undefined) {
        setEnvValue('LOG_CONSOLE', options.console === 'true' ? 'true' : 'false');
        console.log(`Console logging ${options.console === 'true' ? 'enabled' : 'disabled'}`);
      }

      if (options.auditFile) {
        setEnvValue('LOG_AUDIT_FILE', options.auditFile);
        console.log(`Audit log file set to: ${options.auditFile}`);
      }

      if (options.verboseFile) {
        setEnvValue('LOG_VERBOSE_FILE', options.verboseFile);
        console.log(`Verbose log file set to: ${options.verboseFile}`);
      }

      if (!options.level && !options.path && options.console === undefined && 
          !options.auditFile && !options.verboseFile) {
        interactiveLogConfig();
      }
    });

  return prog;
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
  const targetDbName =
    dbName || getEnvValue('DATABASE_NAME') || parsedUrl.database || 'postgres';

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
      await client.query('DROP TABLE IF EXISTS messages CASCADE');
      await client.query('DROP TABLE IF EXISTS chats CASCADE');
      await client.query('DROP TABLE IF EXISTS callback_requests CASCADE');
      await client.query('DROP TABLE IF EXISTS request_logs CASCADE');
      await client.query('DROP TABLE IF EXISTS banned_users CASCADE');
      await client.query('DROP TABLE IF EXISTS admins CASCADE');
      await client.query('DROP TABLE IF EXISTS operators CASCADE');
      await client.query('DROP TABLE IF EXISTS faqs CASCADE');
      await client.query('DROP TABLE IF EXISTS faq_categories CASCADE');
      await client.query('DROP TABLE IF EXISTS sessions CASCADE');
      await client.query('DROP TABLE IF EXISTS categories CASCADE');
    }

    if (schemaFile) {
      const customSchema = fs.readFileSync(schemaFile, 'utf-8');
      await client.query(customSchema);
      console.log('Custom schema applied successfully');
    } else {
      await client.query(`
CREATE TABLE IF NOT EXISTS faq_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

        CREATE TABLE IF NOT EXISTS faqs (
          id SERIAL PRIMARY KEY,
          category_id INTEGER REFERENCES faq_categories(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS operators (
          id SERIAL PRIMARY KEY,
          login VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          user_id BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          user_id BIGINT UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'waiting',
          category VARCHAR(255),
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
          sender_type VARCHAR(20) NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS banned_users (
          id SERIAL PRIMARY KEY,
          user_id BIGINT UNIQUE NOT NULL,
          reason TEXT,
          banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS callback_requests (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          operator_id INTEGER REFERENCES operators(id) ON DELETE SET NULL,
          message TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS request_logs (
          id SERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL,
          text TEXT,
          category VARCHAR(255),
          result_type VARCHAR(20) DEFAULT 'auto_response',
          response_time_ms INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        INSERT INTO faq_categories (name, sort_order, is_default) VALUES
          ('Восстановление доступа', 1, TRUE),
          ('Статус заявки', 2, TRUE),
          ('Общие вопросы', 3, TRUE),
          ('Связаться с оператором', 4, TRUE)
        ON CONFLICT (name) DO NOTHING
      `);

      await client.query(`
        INSERT INTO faqs (category_id, question, answer) VALUES
          (1, 'Как восстановить пароль?', 'Для восстановления пароля перейдите в раздел "Восстановление доступа" на сайте и следуйте инструкциям. Вам на почту будет отправлена ссылка для сброса пароля.'),
          (1, 'Я не могу войти в аккаунт, что делать?', 'Проверьте правильность ввода логина и пароля. Если забыли пароль, воспользуйтесь функцией восстановления. При многократных неудачных попытках войти, аккаунт может быть временно заблокирован - обратитесь в поддержку.'),
          (1, 'Как изменить пароль?', 'Войдите в настройки профиля, выберите раздел "Безопасность" и нажмите "Изменить пароль". Рекомендуется использовать сложный пароль не менее 8 символов.'),

          (2, 'Как проверить статус заявки?', 'Отправьте номер вашей заявки боту, и он покажет текущий статус: "На рассмотрении", "В работе", "Завершено" или "Отклонено".'),
          (2, 'Сколько времени рассматривается заявка?', 'Среднее время рассмотрения заявки составляет 24-48 часов. Сложные заявки могут обрабатываться до 5 рабочих дней.'),
          (2, 'Могу ли я отозвать заявку?', 'Да, вы можете отозвать заявку до её завершения. Для этого нажмите кнопку "Отозвать" в меню заявки или свяжитесь с оператором.'),

          (3, 'Какие услуги вы предоставляете?', 'Мы предоставляем полный спектр услуг: хостинг, доменные имена, SSL-сертификаты, техническая поддержка и консультации. Подробнее на нашем сайте.'),
          (3, 'Как с вами связаться?', 'Вы можете связаться с нами через этот бот, отправив сообщение в категорию "Связаться с оператором", написать на email support@rusnet.ru или позвонить по телефону.'),
          (3, 'Работаете ли вы в выходные?', 'Да, мы работаем круглосуточно 7 дней в неделю. Техническая поддержка доступна в любое время.'),

          (4, 'Как связаться с оператором?', 'Нажмите кнопку "Связаться с оператором" в главном меню бота или отправьте команду /support. Оператор ответит вам в течение нескольких минут.'),
          (4, 'Сколько ждать ответа оператора?', 'Среднее время ожидания ответа оператора составляет 5-15 минут в рабочее время. В пиковые периоды время может увеличиться до 30 минут.'),
          (4, 'Можно ли получить консультацию по телефону?', 'Да, для получения консультации по телефону оставьте заявку через бот с пометкой "Требуется звонок". Оператор перезвонит вам в течение рабочего дня.')
        ON CONFLICT DO NOTHING
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
  const consoleEnabled = getEnvValue('LOG_CONSOLE') || 'true';
  const file = getEnvValue('LOG_FILE') || '(none)';
  const auditFile = getEnvValue('LOG_AUDIT_FILE') || '(none)';
  const verboseFile = getEnvValue('LOG_VERBOSE_FILE') || '(none)';
  console.log('Current logging configuration:');
  console.log(`  LOG_LEVEL: ${level}`);
  console.log(`  LOG_CONSOLE: ${consoleEnabled}`);
  console.log(`  LOG_FILE: ${file}`);
  console.log(`  LOG_AUDIT_FILE: ${auditFile}`);
  console.log(`  LOG_VERBOSE_FILE: ${verboseFile}`);
}

function interactiveLogConfig(): void {
  const currentLevel = getEnvValue('LOG_LEVEL') || 'info';
  const currentConsole = getEnvValue('LOG_CONSOLE') || 'true';
  const currentFile = getEnvValue('LOG_FILE') || '';
  const currentAuditFile = getEnvValue('LOG_AUDIT_FILE') || '';
  const currentVerboseFile = getEnvValue('LOG_VERBOSE_FILE') || '';

  console.log('Current settings:');
  console.log(`  Log level: ${currentLevel}`);
  console.log(`  Console logging: ${currentConsole}`);
  console.log(`  Log file: ${currentFile || '(none)'}`);
  console.log(`  Audit file: ${currentAuditFile || '(none)'}`);
  console.log(`  Verbose file: ${currentVerboseFile || '(none)'}`);
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
        'Enable console logging? (y/n, or press Enter to keep current): ',
        (consoleAnswer: string) => {
          if (consoleAnswer.trim()) {
            const consoleEnabled = consoleAnswer.toLowerCase().startsWith('y');
            setEnvValue('LOG_CONSOLE', consoleEnabled ? 'true' : 'false');
            console.log(`Console logging ${consoleEnabled ? 'enabled' : 'disabled'}`);
          }

          rl.question(
            'Enter log file path (or press Enter to keep current): ',
            (fileAnswer: string) => {
              if (fileAnswer.trim()) {
                setEnvValue('LOG_FILE', fileAnswer.trim());
                console.log(`Log file set to: ${fileAnswer.trim()}`);
              }

              rl.question(
                'Enter audit log file path (or press Enter to keep current): ',
                (auditAnswer: string) => {
                  if (auditAnswer.trim()) {
                    setEnvValue('LOG_AUDIT_FILE', auditAnswer.trim());
                    console.log(`Audit log file set to: ${auditAnswer.trim()}`);
                  }

                  rl.question(
                    'Enter verbose log file path (or press Enter to keep current): ',
                    (verboseAnswer: string) => {
                      rl.close();
                      if (verboseAnswer.trim()) {
                        setEnvValue('LOG_VERBOSE_FILE', verboseAnswer.trim());
                        console.log(`Verbose log file set to: ${verboseAnswer.trim()}`);
                      }
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

async function createAdmin(
  telegramId?: string,
  password?: string
): Promise<void> {
  const url = getEnvValue('DATABASE_URL');
  if (!url) {
    console.error('DATABASE_URL not set. Run "bot db:config --url <url>" first.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });

  try {
    let userId: number;
    let adminPassword: string;

    if (telegramId && password) {
      userId = parseInt(telegramId, 10);
      adminPassword = password;
    } else {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const idAnswer = await new Promise<string>((resolve) => {
        rl.question('Enter Telegram user ID: ', resolve);
      });
      userId = parseInt(idAnswer, 10);

      const passAnswer = await new Promise<string>((resolve) => {
        rl.question('Enter admin password: ', resolve);
      });
      adminPassword = passAnswer;

      rl.close();
    }

    if (isNaN(userId) || userId <= 0) {
      console.error('Invalid Telegram user ID');
      process.exit(1);
    }

    const passwordHash = simpleHash(adminPassword);
    await pool.query(
      `INSERT INTO admins (user_id, password_hash) VALUES ($1, $2)`,
      [userId, passwordHash]
    );
    console.log(`Admin created successfully for user ID: ${userId}`);
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.message.includes('duplicate') || err.code === '23505') {
      console.error('Admin already exists');
    } else {
      console.error('Failed to create admin:', err.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const args = process.argv.slice(2);
if (args.length === 0 || !args[0].includes(':')) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    const prog = createProgram();
    prog.help();
    process.exit(0);
  }
}

if (require.main === module) {
  const prog = createProgram();
  prog.parse(process.argv);
}