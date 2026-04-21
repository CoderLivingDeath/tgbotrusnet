import type { Pool } from "pg";
import type { FAQCategory, FAQ } from "../types/index.js";

export async function getCategories(pool: Pool): Promise<FAQCategory[]> {
  const result = await pool.query(
    `SELECT id, name, sort_order, is_default, created_at 
     FROM faq_categories 
     ORDER BY sort_order`
  );
  return result.rows;
}

export async function getQuestionsByCategory(
  pool: Pool,
  categoryId: number
): Promise<FAQ[]> {
  const result = await pool.query(
    `SELECT id, category_id, question, answer, created_at 
     FROM faqs 
     WHERE category_id = $1 
     ORDER BY id`,
    [categoryId]
  );
  return result.rows;
}

export async function searchFAQs(pool: Pool, keyword: string): Promise<FAQ[]> {
  const result = await pool.query(
    `SELECT id, category_id, question, answer, faqs.created_at 
     FROM faqs 
     JOIN faq_categories ON faqs.category_id = faq_categories.id
     WHERE faqs.question ILIKE $1 OR faqs.answer ILIKE $1
     ORDER BY faqs.id`,
    [`%${keyword}%`]
  );
  return result.rows;
}

export async function createCategory(
  pool: Pool,
  name: string,
  sortOrder: number = 0
): Promise<FAQCategory> {
  const result = await pool.query(
    `INSERT INTO faq_categories (name, sort_order) 
     VALUES ($1, $2) 
     RETURNING id, name, sort_order, is_default, created_at`,
    [name, sortOrder]
  );
  return result.rows[0];
}

export async function createFAQ(
  pool: Pool,
  categoryId: number,
  question: string,
  answer: string
): Promise<FAQ> {
  const result = await pool.query(
    `INSERT INTO faqs (category_id, question, answer) 
     VALUES ($1, $2, $3) 
     RETURNING id, category_id, question, answer, created_at`,
    [categoryId, question, answer]
  );
  return result.rows[0];
}

export async function deleteCategory(
  pool: Pool,
  categoryId: number
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM faq_categories WHERE id = $1`,
    [categoryId]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteFAQ(pool: Pool, faqId: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM faqs WHERE id = $1`, [faqId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getFAQById(pool: Pool, faqId: number): Promise<FAQ | null> {
  const result = await pool.query(
    `SELECT id, category_id, question, answer, created_at 
     FROM faqs 
     WHERE id = $1`,
    [faqId]
  );
  return result.rows[0] ?? null;
}