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
  login: string;
  password_hash: string;
  is_active: boolean;
  user_id: number | null;
  created_at: Date;
}

export interface Admin {
  id: number;
  user_id: number;
  password_hash: string;
  created_at: Date;
}

export interface BannedUser {
  id: number;
  user_id: number;
  reason: string;
  banned_at: Date;
}

export interface CallbackRequest {
  id: number;
  user_id: number;
  operator_id: number | null;
  message: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  comment: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface RequestLog {
  id: number;
  user_id: number;
  text: string;
  category: string | null;
  result_type: "auto_response" | "escalation" | "callback_request" | "error";
  response_time_ms: number;
  created_at: Date;
}

export interface Session {
  token: string;
  type: "admin" | "operator";
  user_id: number;
  expires_at: Date;
}

export interface RequestStatistics {
  total: number;
  auto_responses: number;
  escalations: number;
  average_response_time_ms: number;
  period_start: Date;
  period_end: Date;
}