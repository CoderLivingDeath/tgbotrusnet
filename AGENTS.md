# AGENTS.md - Developer Guidelines

This file provides guidelines for AI agents operating in this codebase.

## Project Overview

- **Type**: Telegram Bot (Node.js/TypeScript)
- **Framework**: Telegraf v4
- **Package Manager**: npm

## Commands

### Build & Run

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Run with ts-node (live reload)
npm run start      # Run compiled JS from dist/
```

### Linting & Formatting

```bash
npm run lint       # Run ESLint on src/**/*.ts
npm run format     # Run Prettier (auto-fix formatting)
```

### Single File Operations

```bash
npx tsc src/specific-file.ts    # Compile single file
npx eslint src/specific-file.ts # Lint single file
npx prettier --write src/file.ts
```

## Code Style

### TypeScript Configuration

- Target: ES2020, Module: CommonJS, Strict mode enabled
- Declaration files generated

### Naming Conventions

- **Files**: kebab-case (e.g., `user-handler.ts`)
- **Classes/Types**: PascalCase (e.g., `BotContext`)
- **Functions/variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### Imports

```typescript
// Named imports (preferred)
import { Telegraf, Composer } from 'telegraf';
import { MyClass, myFunction } from './my-module';

// Default import
import Telegraf from 'telegraf';

// Relative imports first, then packages
import { helper } from '../utils/helper';
import { config } from 'dotenv';
```

### Formatting Rules

- Use Prettier for all formatting
- Single quotes for strings, semicolons required
- 2 spaces indentation, trailing commas

### Type Annotations

- Use explicit types for function parameters and return types
- Use `const` with type inference for local variables when obvious
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Avoid
function bad(a: any): any { ... }
```

### Error Handling

```typescript
try {
  await dangerousOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    ctx.reply('Invalid input: ' + error.message);
  } else {
    console.error('Unexpected error:', error);
    ctx.reply('An error occurred');
  }
}

// Custom error class
class BotError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BotError';
  }
}
```

### Telegraf Bot Patterns

```typescript
import { Telegraf, Context, Composer, Middleware } from 'telegraf';

// Bot instance
const bot = new Telegraf<Context>(process.env.BOT_TOKEN);

// Command
bot.command('start', (ctx) => ctx.reply('Welcome!'));

// Middleware
const authMiddleware: Middleware<Context> = (ctx, next) => {
  if (ctx.from?.id === ADMIN_ID) return next();
  ctx.reply('Unauthorized');
};

// Composer
const adminScene = new Composer<Context>();
adminScene.use(authMiddleware);
adminScene.on('message', handleAdminMessage);
```

### Async/Await

- Handle promises with async/await, include try-catch
- Use Promise.all for parallel operations

```typescript
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/users/${id}`);
    return response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    return null;
  }
}
```

### Environment Variables

- Never hardcode secrets, use `.env` file
- Provide `.env.example` with placeholder values
- Reference via `process.env.VARIABLE_NAME`

### Testing

```bash
npm test        # Run Jest tests
npm run test:watch  # Run tests in watch mode
```

Note: Requires `@types/jest` package. Install with `npm i -D @types/jest` if missing.

### Comments

- Add comments for complex business logic only
- Use JSDoc for public API functions

## Security

- Never log sensitive data (tokens, passwords)
- Validate all user input
- Don't commit `.env` files

## Workflow

1. Create branch for changes
2. Make changes following this guide
3. Run lint and format before commit
4. Build to verify compilation

## File Organization

```
src/
  index.ts          # Entry point (bot initialization)
  commands/        # Bot command handlers
  middleware/      # Custom middleware
  handlers/        # Message handlers
  utils/           # Helper functions
  types/           # TypeScript types
  services/        # External service integrations
```

One primary export per file, re-export from index.ts.