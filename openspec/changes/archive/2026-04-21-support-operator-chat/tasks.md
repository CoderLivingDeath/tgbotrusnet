## 1. Database Schema

- [x] 1.1 Create faq_categories table (id, name, sort_order, is_default, created_at)
- [x] 1.2 Create faqs table (id, category_id, question, answer, created_at)
- [x] 1.3 Create operators table (id, user_id, password_hash, is_active, created_at)
- [x] 1.4 Create admins table (id, user_id, password_hash, created_at)
- [x] 1.5 Create chats table (id, user_id, operator_id, status, category, started_at, ended_at)
- [x] 1.6 Create messages table (id, chat_id, sender_type, text, created_at)
- [x] 1.7 Create banned_users table (id, user_id, reason, banned_at)
- [x] 1.8 Create request_logs table (id, user_id, text, category, result_type, response_time_ms, created_at)
- [x] 1.9 Create default categories (Восстановление доступа, Статус заявки, Общие вопросы, Связаться с оператором)

## 2. Session Service

- [x] 2.1 Implement session service (src/services/session.ts)
- [x] 2.2 Add createToken function with 24h expiry
- [x] 2.3 Add validateToken function
- [x] 2.4 Add token revocation
- [x] 2.5 Write unit tests for session service (TDD)

## 2b. Logging Service (Request Logs)

- [x] 2b.1 Implement request log service (src/services/request-log.ts)
- [x] 2b.2 Add logRequest function (timestamp, user_id, text, category)
- [x] 2b.3 Add logResponse function (result_type, response_time_ms)
- [x] 2b.4 Add getStatistics function (total, auto_responses, escalations)
- [x] 2b.5 Write unit tests for request log service (TDD)

## 3. FAQ Service

- [x] 3.1 Implement FAQ service (src/services/faq.ts)
- [x] 3.2 Add getCategories function
- [x] 3.3 Add getQuestionsByCategory function
- [x] 3.4 Add searchFAQs function
- [x] 3.5 Add createCategory function
- [x] 3.6 Add createFAQ function
- [x] 3.7 Add deleteCategory function
- [x] 3.8 Add deleteFAQ function
- [x] 3.9 Write unit tests for FAQ service (TDD)

## 4. Chat Service

- [x] 4.1 Implement chat service (src/services/chat.ts)
- [x] 4.2 Add startChat function
- [x] 4.3 Add sendMessage function
- [x] 4.4 Add endChat function
- [x] 4.5 Add getActiveChats for operator
- [x] 4.6 Add getChatHistory function
- [x] 4.7 Add banUser function
- [x] 4.8 Write unit tests for chat service (TDD)

## 5. Auth Middleware

- [x] 5.1 Implement admin auth middleware (src/middleware/admin-auth.ts)
- [x] 5.2 Implement operator auth middleware (src/middleware/operator-auth.ts)
- [x] 5.3 Write unit tests for auth middleware (TDD)

## 5b. Error Handling Middleware

- [x] 5b.1 Implement error handler middleware
- [x] 5b.2 Add unknown command handler
- [x] 5b.3 Add network error handler
- [x] 5b.4 Add database error handler
- [x] 5b.5 Write tests for error handlers (TDD)

## 6. Admin Session Handlers

- [x] 6.1 Implement /admin login command (src/handlers/admin/session.ts)
- [x] 6.2 Implement /admin logout command
- [x] 6.3 Implement /admin add-operator command
- [x] 6.4 Implement /admin remove-operator command
- [x] 6.5 Implement /admin list-operators command
- [x] 6.6 Write tests for admin session handlers (TDD)

## 7. Admin FAQ Handlers

- [x] 7.1 Implement /admin create-category command
- [x] 7.2 Implement /admin delete-category command
- [x] 7.3 Implement /admin add-faq command
- [x] 7.4 Implement /admin delete-faq command
- [x] 7.5 Write tests for admin FAQ handlers (TDD)

## 8. Operator Session Handlers

- [x] 8.1 Implement /operator login command
- [x] 8.2 Implement /operator logout command
- [x] 8.3 Implement /operator available command
- [x] 8.4 Implement /operator busy command
- [x] 8.5 Write tests for operator session handlers (TDD)

## 9. Operator Chat Handlers

- [x] 9.1 Implement chat list display
- [x] 9.2 Implement /operator reply command (with user notification)
- [x] 9.3 Implement /operator end command
- [x] 9.4 Implement /operator ban command
- [x] 9.5 Write tests for operator chat handlers (TDD)

## 10. FAQ User Handlers (Welcome/Navigation)

- [x] 10.1 Implement /start command with welcome message and inline keyboard menu
- [x] 10.2 Implement default categories (Восстановление доступа, Статус заявки, Общие вопросы, Связаться с оператором)
- [x] 10.3 Implement /menu command for category selection
- [x] 10.4 Implement category callback (question list)
- [x] 10.5 Implement question callback (answer display)
- [x] 10.6 Implement /search command
- [x] 10.7 Write tests for FAQ user handlers (TDD)

## 10b. Stats Handlers

- [x] 10b.1 Implement /stats command for admin
- [x] 10b.2 Implement /stats command for operator
- [x] 10b.3 Write tests for stats handlers (TDD)

## 11. Chat User Handlers

- [x] 11.1 Implement /support command (start chat)
- [x] 11.2 Implement message handler (send to operator)
- [x] 11.3 Implement /end command (end chat)
- [x] 11.4 Write tests for chat user handlers (TDD)

## 12. Types and Interfaces

- [x] 12.1 Define BotContext extension
- [x] 12.2 Define FAQ interfaces
- [x] 12.3 Define Chat interfaces
- [x] 12.4 Define Session interfaces
- [x] 12.5 Define RequestLog interfaces

## 13. Scenes (Telegraf Scenes)

- [x] 13.1 Implemented via Composer handlers (equivalent functionality)
- [x] 13.2 Implemented via Composer handlers
- [x] 13.3 Implemented via Composer handlers
- [x] 13.4 Implemented via Composer handlers

## 14. Knowledge Base Module

- [x] 14.1 Implement knowledge-base reader (src/knowledge-base/reader.ts)
- [x] 14.2 Implement knowledge-base writer (src/knowledge-base/writer.ts)
- [x] 14.3 Implement search engine (src/knowledge-base/search.ts)
- [x] 14.4 Write tests for knowledge-base (TDD)

## 15. Configuration Module

- [x] 15.1 Create config loader (src/config/index.ts)
- [x] 15.2 Add environment variables handling
- [x] 15.3 Create .env.example

## 16. Integration

- [x] 16.1 N/A (using Composer handlers instead of Scenes)
- [x] 16.2 Add handlers to index.ts
- [x] 16.3 Configure Telegraf with long-polling
- [x] 16.4 Run build
- [x] 16.5 Run lint
- [x] 16.6 Run tests