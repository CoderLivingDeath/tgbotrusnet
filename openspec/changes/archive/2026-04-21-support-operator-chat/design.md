## Context

The bot currently has no support functionality. Users cannot get answers to typical questions or contact support staff. The infrastructure includes database (pg) and logging (pino), but lacks any user support features.

### Current State
- Bot with basic command handlers
- PostgreSQL database available via `src/services/database.ts`
- Logging via `src/services/logger.ts`
- CLI arguments (host, port, log-path, log-pretty)

### Constraints
- Use existing Telegraf v4 framework
- Use pg for database, pino for logging
- CommonJS modules
- TypeScript with strict mode
- Red-Green-Refactor TDD approach

### Stakeholders
- Bot users needing support
- Support operators handling chats
- Admins managing the system

## Goals / Non-Goals

**Goals:**
- FAQ system with categorized questions and inline keyboard navigation
- Real-time chat between users and operators
- Protected admin session for system management
- Protected operator session for chat handling
- All features developed with TDD (Red-Green-Refactor)

**Non-Goals:**
- AI/automatic responses (manual operator responses only)
- Multi-language support (Russian only)
- File attachments in chat (text only)
- Persistent chat sessions across bot restarts (sessions stored in memory for now)

## Integration Requirements

### Telegram Integration
- Use Telegraf v4 library
- Long-polling mode (default) or webhook (if public server available)
- Notify operators via same bot with operator permissions

### Database
- PostgreSQL for knowledge base storage
- All FAQ data stored in database for dynamic management

### Operator Notifications
- When user requests operator, notify all available operators via bot message
- Operators receive inline keyboard list of pending chats
- Each operator has separate chat view with user context

## Decisions

### 1. Session Management
**Decision:** Use password-based session tokens stored in memory.

**Rationale:** Simpler than database-backed sessions. Tokens are generated on admin/operator login and validated on each action. Token expiry after 24 hours.

**Alternatives Considered:**
- Database sessions: Too complex for initial implementation
- JWT: Adds dependency, overkill for internal tool

### 2. FAQ Storage
**Decision:** Store FAQs in PostgreSQL database.

**Rationale:** Allows dynamic management without code changes. Simple schema with categories and questions.

**Alternatives Considered:**
- JSON config file: Hard to manage dynamically, less scalable
- In-memory: Lost on restart, harder to manage

### 3. Chat Architecture
**Decision:** Each user gets one active chat with an available operator.

**Rationale:** Simplifies queue management. When user starts chat, they're matched with next available operator. Chat ends when either party ends it.

**Alternatives Considered:**
- Multiple concurrent chats per operator: More complex, operator can handle multiple
- Chat rooms: Overkill for 1:1 support

### 4. TDD Workflow
**Decision:** Strict Red-Green-Refactor for all features.

**Rationale:** Ensures testability from the start. Each feature has clear requirements before implementation.

**Implementation:**
1. Red: Write failing test
2. Green: Write minimal code to pass
3. Refactor: Improve code while keeping tests green

## Risks / Trade-offs

- [Risk] Operator goes offline while handling chats → **Mitigation:** Chat reassignment to another operator if offline detected
- [Risk] Spam/abuse in chat → **Mitigation:** Operator can ban user, admin can unban
- [Risk] All operators busy → **Mitigation:** User gets message "all operators busy, try later"
- [Risk] Session token leaked → **Mitigation:** Tokens expire in 24h, admin can revoke all tokens

## Migration Plan

1. Create database tables (faqs, categories, operators, admins, chats, messages)
2. Implement admin session (login, manage operators, manage FAQs)
3. Implement operator session (login, handle chats)
4. Implement FAQ system for users
5. Implement chat system for users
6. Deploy and test

**Rollback:** Remove new tables, remove new handlers from index.ts.

## Open Questions

- Should operators see chat history before accepting?
- How to handle operator availability status?
- FAQ search by keywords or just categories?

## Non-Functional Requirements

### Performance
- Response time: ≤2 seconds for typical requests (without network latency)
- Concurrent chats: Support ≥100 parallel conversations without degradation

### Availability
- Uptime: ≥99.5% (24/7 operation)
- Graceful degradation under load

### Code Quality
- Use TypeScript with strict mode
- Modular structure: commands, middleware, scenes, knowledge base, logging, error handling
- Centralized exception handling with log file

### Deployment
- Linux server compatibility
- CLI arguments for configuration