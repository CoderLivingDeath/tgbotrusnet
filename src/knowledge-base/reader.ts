import type { Pool } from "pg";
import type { FAQCategory, FAQ } from "../types/index.js";
import { getCategories, getQuestionsByCategory } from "../services/faq.js";

export interface KnowledgeBaseEntry {
  id: number;
  category: string;
  question: string;
  answer: string;
}

export async function readAllCategories(pool: Pool): Promise<FAQCategory[]> {
  return getCategories(pool);
}

export async function readCategoryQuestions(
  pool: Pool,
  categoryId: number
): Promise<FAQ[]> {
  return getQuestionsByCategory(pool, categoryId);
}

export async function readFAQEntry(
  pool: Pool,
  faqId: number
): Promise<KnowledgeBaseEntry | null> {
  const { getFAQById } = await import("../services/faq.js");

  const faq = await getFAQById(pool, faqId);

  if (!faq) {
    return null;
  }

  const categories = await getCategories(pool);
  const category = categories.find((c) => c.id === faq.category_id);

  return {
    id: faq.id,
    category: category?.name ?? "Без категории",
    question: faq.question,
    answer: faq.answer,
  };
}