import type { Pool } from "pg";
import type { FAQCategory, FAQ } from "../types/index";

/**
 * Retrieves all FAQ categories ordered by sort order.
 * @param pool - PostgreSQL connection pool
 * @returns Array of FAQCategory objects
 */
export async function getCategories(pool: Pool): Promise<FAQCategory[]> {
  const result = await pool.query(
    `SELECT id, name, sort_order, is_default, created_at 
     FROM faq_categories 
     ORDER BY sort_order`
  );
  return result.rows;
}

/**
 * Retrieves all FAQs for a specific category.
 * @param pool - PostgreSQL connection pool
 * @param categoryId - The category ID
 * @returns Array of FAQ objects
 */
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

/**
 * Searches FAQs by keyword in question or answer.
 * @param pool - PostgreSQL connection pool
 * @param keyword - Search keyword (case-insensitive)
 * @returns Array of matching FAQ objects
 */
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

/**
 * Creates a new FAQ category.
 * @param pool - PostgreSQL connection pool
 * @param name - Category name
 * @param sortOrder - Optional sort order (default: 0)
 * @returns The created FAQCategory object
 */
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

/**
 * Creates a new FAQ entry.
 * @param pool - PostgreSQL connection pool
 * @param categoryId - The FAQ category ID
 * @param question - The question text
 * @param answer - The answer text
 * @returns The created FAQ object
 */
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

/**
 * Deletes an FAQ category and all its FAQs.
 * @param pool - PostgreSQL connection pool
 * @param categoryId - The category ID to delete
 * @returns True if category was deleted, false otherwise
 */
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

/**
 * Deletes an FAQ entry.
 * @param pool - PostgreSQL connection pool
 * @param faqId - The FAQ ID to delete
 * @returns True if FAQ was deleted, false otherwise
 */
export async function deleteFAQ(pool: Pool, faqId: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM faqs WHERE id = $1`, [faqId]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Retrieves a single FAQ by its ID.
 * @param pool - PostgreSQL connection pool
 * @param faqId - The FAQ ID
 * @returns The FAQ object if found, null otherwise
 */
export async function getFAQById(pool: Pool, faqId: number): Promise<FAQ | null> {
  const result = await pool.query(
    `SELECT id, category_id, question, answer, created_at 
     FROM faqs 
     WHERE id = $1`,
    [faqId]
  );
  return result.rows[0] ?? null;
}

/**
 * Alias for searchFAQs for API compatibility.
 * @param pool - PostgreSQL connection pool
 * @param keyword - Search keyword
 * @returns Array of matching FAQ objects
 */
export async function searchFaqs(pool: Pool, keyword: string): Promise<FAQ[]> {
  return searchFAQs(pool, keyword);
}