import "server-only";
import { neon } from "@neondatabase/serverless";

let initialized = false;

export function database() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(databaseUrl);
}

export async function ensureSubmissionTable() {
  if (initialized) return;

  const sql = database();
  await sql`
    CREATE TABLE IF NOT EXISTS questionnaire_submissions (
      id TEXT PRIMARY KEY,
      questionnaire_version TEXT NOT NULL,
      language TEXT NOT NULL CHECK (language IN ('ar', 'en')),
      respondent JSONB NOT NULL DEFAULT '{}'::jsonb,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      answer_count INTEGER NOT NULL DEFAULT 0,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_agent TEXT,
      reset_token_hash TEXT,
      source TEXT NOT NULL DEFAULT 'web'
    )
  `;
  await sql`
    ALTER TABLE questionnaire_submissions
    ADD COLUMN IF NOT EXISTS reset_token_hash TEXT
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS questionnaire_submissions_submitted_at_idx
    ON questionnaire_submissions (submitted_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS questionnaire_submissions_email_idx
    ON questionnaire_submissions ((respondent ->> 'email'))
  `;
  initialized = true;
}
