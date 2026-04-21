import 'reflect-metadata';
import { injectable, singleton } from 'tsyringe';
import type { DatabasePool } from '../services/database';

export const TYPES = {
  DatabasePool: Symbol('DatabasePool'),
  Logger: Symbol('Logger'),
  FaqService: Symbol('FaqService'),
  ChatService: Symbol('ChatService'),
};

export interface IFaqService {
  getCategories(pool: DatabasePool): Promise<Array<{ id: number; name: string }>>;
  getQuestionsByCategory(pool: DatabasePool, categoryId: number): Promise<Array<{ id: number; question: string }>>;
  getFAQById(pool: DatabasePool, faqId: number): Promise<{ id: number; question: string; answer: string } | null>;
}

export interface IChatService {
  startChat(pool: DatabasePool, userId: number, category: string | null): Promise<{ id: number; user_id: number }>;
  getActiveChats(pool: DatabasePool): Promise<Array<{ id: number; user_id: number }>>;
  getActiveChatsForOperator(pool: DatabasePool, operatorId: number): Promise<Array<{ id: number; user_id: number }>>;
  assignOperatorToChat(pool: DatabasePool, chatId: number, operatorId: number): Promise<{ id: number } | null>;
  sendMessage(pool: DatabasePool, chatId: number, senderType: 'user' | 'operator' | 'system', text: string): Promise<{ id: number }>;
  getChatHistory(pool: DatabasePool, chatId: number): Promise<Array<{ id: number; sender_type: string; text: string }>>;
  endChat(pool: DatabasePool, chatId: number): Promise<{ id: number } | null>;
  isUserBanned(pool: DatabasePool, userId: number): Promise<boolean>;
  getAvailableOperators(pool: DatabasePool): Promise<Array<{ id: number; user_id: number }>>;
}

@injectable()
@singleton()
export class FaqService implements IFaqService {
  async getCategories(pool: DatabasePool): Promise<Array<{ id: number; name: string }>> {
    const result = await pool.query('SELECT id, name FROM faq_categories ORDER BY sort_order');
    return result.rows;
  }

  async getQuestionsByCategory(pool: DatabasePool, categoryId: number): Promise<Array<{ id: number; question: string }>> {
    const result = await pool.query('SELECT id, question FROM faqs WHERE category_id = $1', [categoryId]);
    return result.rows;
  }

  async getFAQById(pool: DatabasePool, faqId: number): Promise<{ id: number; question: string; answer: string } | null> {
    const result = await pool.query('SELECT id, question, answer FROM faqs WHERE id = $1', [faqId]);
    return result.rows[0] || null;
  }
}

@injectable()
@singleton()
export class ChatService implements IChatService {
  async startChat(pool: DatabasePool, userId: number, category: string | null): Promise<{ id: number; user_id: number }> {
    const result = await pool.query(
      'INSERT INTO chats (user_id, status, category) VALUES ($1, \'waiting\', $2) RETURNING id, user_id',
      [userId, category]
    );
    return result.rows[0];
  }

  async getActiveChats(pool: DatabasePool): Promise<Array<{ id: number; user_id: number }>> {
    const result = await pool.query(
      'SELECT id, user_id FROM chats WHERE status IN (\'waiting\', \'active\') ORDER BY started_at'
    );
    return result.rows;
  }

  async getActiveChatsForOperator(pool: DatabasePool, operatorId: number): Promise<Array<{ id: number; user_id: number }>> {
    const result = await pool.query(
      'SELECT id, user_id FROM chats WHERE operator_id = $1 AND status IN (\'waiting\', \'active\')',
      [operatorId]
    );
    return result.rows;
  }

  async assignOperatorToChat(pool: DatabasePool, chatId: number, operatorId: number): Promise<{ id: number } | null> {
    const result = await pool.query(
      'UPDATE chats SET operator_id = $1, status = \'active\' WHERE id = $2 AND status = \'waiting\' RETURNING id',
      [operatorId, chatId]
    );
    return result.rows[0] || null;
  }

  async sendMessage(pool: DatabasePool, chatId: number, senderType: 'user' | 'operator' | 'system', text: string): Promise<{ id: number }> {
    const result = await pool.query(
      'INSERT INTO messages (chat_id, sender_type, text) VALUES ($1, $2, $3) RETURNING id',
      [chatId, senderType, text]
    );
    return result.rows[0];
  }

  async getChatHistory(pool: DatabasePool, chatId: number): Promise<Array<{ id: number; sender_type: string; text: string }>> {
    const result = await pool.query(
      'SELECT id, sender_type, text FROM messages WHERE chat_id = $1 ORDER BY created_at',
      [chatId]
    );
    return result.rows;
  }

  async endChat(pool: DatabasePool, chatId: number): Promise<{ id: number } | null> {
    const result = await pool.query(
      'UPDATE chats SET status = \'closed\', ended_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [chatId]
    );
    return result.rows[0] || null;
  }

  async isUserBanned(pool: DatabasePool, userId: number): Promise<boolean> {
    const result = await pool.query('SELECT id FROM banned_users WHERE user_id = $1', [userId]);
    return result.rows.length > 0;
  }

  async getAvailableOperators(pool: DatabasePool): Promise<Array<{ id: number; user_id: number }>> {
    const result = await pool.query('SELECT id, user_id FROM operators WHERE is_active = TRUE');
    return result.rows;
  }
}

export const FaqServiceToken = TYPES.FaqService;
export const ChatServiceToken = TYPES.ChatService;