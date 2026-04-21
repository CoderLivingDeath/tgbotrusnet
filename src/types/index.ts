export interface FAQCategory {
  id: number;
  name: string;
  sort_order: number;
  is_default: boolean;
  created_at: Date;
}

export interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  created_at: Date;
}

export interface Operator {
  id: number;
  user_id: number;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
}

export interface Admin {
  id: number;
  user_id: number;
  password_hash: string;
  created_at: Date;
}

export interface Chat {
  id: number;
  user_id: number;
  operator_id: number | null;
  status: "waiting" | "active" | "closed";
  category: string | null;
  started_at: Date;
  ended_at: Date | null;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_type: "user" | "operator" | "system";
  text: string;
  created_at: Date;
}

export interface BannedUser {
  id: number;
  user_id: number;
  reason: string;
  banned_at: Date;
}

export interface RequestLog {
  id: number;
  user_id: number;
  text: string;
  category: string | null;
  result_type: "auto_response" | "escalation" | "error";
  response_time_ms: number;
  created_at: Date;
}

export interface Session {
  token: string;
  type: "admin" | "operator";
  user_id: number;
  expires_at: Date;
}

export interface ChatContext {
  chat: Chat;
  messages: ChatMessage[];
  user_id: number;
  category: string | null;
}

export interface RequestStatistics {
  total: number;
  auto_responses: number;
  escalations: number;
  average_response_time_ms: number;
  period_start: Date;
  period_end: Date;
}