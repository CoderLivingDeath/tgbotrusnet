/**
 * Database migration: Rename request_logs columns from message/handler to text/category
 * This fixes the SQL mismatch that was causing errors in logRequest().
 */
export const up = `
ALTER TABLE request_logs RENAME COLUMN message TO text;
ALTER TABLE request_logs RENAME COLUMN handler TO category;
`;

export const down = `
ALTER TABLE request_logs RENAME COLUMN text TO message;
ALTER TABLE request_logs RENAME COLUMN category TO handler;
`;