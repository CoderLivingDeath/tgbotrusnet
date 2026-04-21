## Why

Telegram bot currently lacks customer support functionality. Users cannot get help with typical questions or communicate with operators. Implementing this will enable direct user support through the bot, improving user experience and reducing support overhead.

## What Changes

- Add welcome dialog and /start with inline keyboard menu (4 categories)
- Add FAQ/knowledge base system for typical questions with inline keyboard navigation
- Implement operator chat functionality for real-time user-operator communication
- Implement request logging with statistics for admin/operator
- Create protected admin session for managing operators and FAQ
- Create protected operator session for handling user chats
- Add centralized error handling with logging
- Add Red-Green-Refactor TDD workflow for all new features

## Capabilities

### New Capabilities
- `welcome-navigation`: Welcome message and category menu with inline keyboards
- `faq-system`: Frequently asked questions with categorized navigation and searchable answers
- `operator-chat`: Real-time messaging between users and operators with context preservation
- `request-logging`: Log all requests with statistics (total, auto-responses, escalations)
- `admin-session`: Protected admin access for managing operators, FAQ categories, and stats
- `operator-session`: Protected operator access for handling chats and viewing stats
- `error-handling`: Centralized exception handling with user-friendly messages
- `tdd-workflow`: Red-Green-Refactor testing methodology integrated into development

### Modified Capabilities
- None (new functionality)

## Impact

**Component Structure:**
- `src/index.ts` - Entry point, Telegraf initialization, middleware
- `src/scenes/` - Dialog scenarios (category selection, escalation, operator chat)
- `src/handlers/` - Command handlers (/start, /help, /stats) and text messages
- `src/knowledge-base/` - Knowledge base module (read/write/search)
- `src/logger/` - Logging events and errors
- `src/types/` - TypeScript interfaces and data types
- `src/config/` - Configuration (bot token, logging params)

**New modules:**
- `src/middleware/` - Auth, error handling middleware
- `src/services/` - Session, FAQ, chat, request log services
- `src/scenes/` - Category scene, escalation scene, operator scene

**Database tables:** `faq_categories`, `faqs`, `chats`, `messages`, `operators`, `admins`, `request_logs`, `banned_users`

**Dependencies:** None (using existing Telegraf v4, pg, pino)
