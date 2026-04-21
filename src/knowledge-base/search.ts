import type { Pool } from "pg";
import type { FAQ } from "../types/index.js";
import { searchFAQs } from "../services/faq.js";

export interface SearchOptions {
  keyword: string;
  limit?: number;
}

export interface SearchResult {
  faqs: FAQ[];
  total: number;
}

export async function searchKnowledgeBase(
  pool: Pool,
  options: SearchOptions
): Promise<SearchResult> {
  const limit = options.limit ?? 10;

  const faqs = await searchFAQs(pool, options.keyword);

  return {
    faqs: faqs.slice(0, limit),
    total: faqs.length,
  };
}