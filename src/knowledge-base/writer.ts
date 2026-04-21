import type { Pool } from "pg";
import type { FAQCategory, FAQ } from "../types/index.js";
import { createCategory, createFAQ, deleteCategory, deleteFAQ } from "../services/faq.js";

export interface NewCategoryInput {
  name: string;
  sortOrder?: number;
}

export interface NewFAQInput {
  categoryId: number;
  question: string;
  answer: string;
}

export async function writeNewCategory(
  pool: Pool,
  input: NewCategoryInput
): Promise<FAQCategory> {
  return createCategory(pool, input.name, input.sortOrder ?? 0);
}

export async function writeNewFAQ(pool: Pool, input: NewFAQInput): Promise<FAQ> {
  return createFAQ(pool, input.categoryId, input.question, input.answer);
}

export async function removeCategory(pool: Pool, categoryId: number): Promise<boolean> {
  return deleteCategory(pool, categoryId);
}

export async function removeFAQ(pool: Pool, faqId: number): Promise<boolean> {
  return deleteFAQ(pool, faqId);
}