CREATE TABLE IF NOT EXISTS questionnaire_submissions (
  id TEXT PRIMARY KEY,
  questionnaire_version TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('ar', 'en')),
  respondent JSONB NOT NULL DEFAULT '{}'::jsonb,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  answer_count INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'web'
);

CREATE INDEX IF NOT EXISTS questionnaire_submissions_submitted_at_idx
  ON questionnaire_submissions (submitted_at DESC);

CREATE INDEX IF NOT EXISTS questionnaire_submissions_email_idx
  ON questionnaire_submissions ((respondent ->> 'email'));
