import "server-only";

import { database, ensureSubmissionTable } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export type AdminSubmissionSummary = {
  id: string;
  language: "ar" | "en";
  respondentName: string;
  respondentRole: string;
  respondentEmail: string;
  answerCount: number;
  submittedAt: string;
};

export type AdminSubmission = {
  id: string;
  questionnaireVersion: string;
  language: "ar" | "en";
  respondent: Record<string, string>;
  answers: Record<string, string | string[]>;
  answerCount: number;
  submittedAt: string;
  source: string;
};

export type AdminDashboardData = {
  stats: {
    total: number;
    recent: number;
    averageAnswers: number;
    lastSubmission: string | null;
  };
  submissions: AdminSubmissionSummary[];
  query: string;
  page: number;
  pageSize: number;
  filteredTotal: number;
  totalPages: number;
};

type StatsRow = {
  total: number;
  recent: number;
  average_answers: number;
  last_submission: string | null;
};

type SummaryRow = {
  id: string;
  language: "ar" | "en";
  respondent_name: string | null;
  respondent_role: string | null;
  respondent_email: string | null;
  answer_count: number;
  submitted_at: string;
};

type SubmissionRow = {
  id: string;
  questionnaire_version: string;
  language: "ar" | "en";
  respondent: Record<string, string>;
  answers: Record<string, string | string[]>;
  answer_count: number;
  submitted_at: string;
  source: string;
};

const PAGE_SIZE = 20;

function clampPage(value: number) {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(Math.floor(value), 10_000);
}

export async function getAdminDashboardData(search: string, requestedPage: number) {
  await requireAdminSession();
  await ensureSubmissionTable();

  const query = search.trim().slice(0, 100);
  const pattern = `%${query}%`;
  const sql = database();

  const statsPromise = sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE submitted_at >= NOW() - INTERVAL '7 days')::int AS recent,
      COALESCE(ROUND(AVG(answer_count)::numeric, 1), 0)::float8 AS average_answers,
      MAX(submitted_at)::text AS last_submission
    FROM questionnaire_submissions
  `;

  const countPromise = query
    ? sql`
        SELECT COUNT(*)::int AS count
        FROM questionnaire_submissions
        WHERE id ILIKE ${pattern}
          OR respondent ->> 'name' ILIKE ${pattern}
          OR respondent ->> 'email' ILIKE ${pattern}
          OR respondent ->> 'role' ILIKE ${pattern}
      `
    : sql`SELECT COUNT(*)::int AS count FROM questionnaire_submissions`;

  const [statsRows, countRows] = await Promise.all([statsPromise, countPromise]);
  const filteredTotal = Number((countRows[0] as { count?: number } | undefined)?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const page = Math.min(clampPage(requestedPage), totalPages);
  const offset = (page - 1) * PAGE_SIZE;

  const rows = query
    ? await sql`
        SELECT
          id,
          language,
          respondent ->> 'name' AS respondent_name,
          respondent ->> 'role' AS respondent_role,
          respondent ->> 'email' AS respondent_email,
          answer_count,
          submitted_at::text AS submitted_at
        FROM questionnaire_submissions
        WHERE id ILIKE ${pattern}
          OR respondent ->> 'name' ILIKE ${pattern}
          OR respondent ->> 'email' ILIKE ${pattern}
          OR respondent ->> 'role' ILIKE ${pattern}
        ORDER BY submitted_at DESC
        LIMIT ${PAGE_SIZE}
        OFFSET ${offset}
      `
    : await sql`
        SELECT
          id,
          language,
          respondent ->> 'name' AS respondent_name,
          respondent ->> 'role' AS respondent_role,
          respondent ->> 'email' AS respondent_email,
          answer_count,
          submitted_at::text AS submitted_at
        FROM questionnaire_submissions
        ORDER BY submitted_at DESC
        LIMIT ${PAGE_SIZE}
        OFFSET ${offset}
      `;

  const statsRow = (statsRows[0] ?? {}) as StatsRow;
  const submissions = (rows as SummaryRow[]).map((row) => ({
    id: row.id,
    language: row.language,
    respondentName: row.respondent_name?.trim() || "بدون اسم",
    respondentRole: row.respondent_role?.trim() || "—",
    respondentEmail: row.respondent_email?.trim() || "—",
    answerCount: Number(row.answer_count ?? 0),
    submittedAt: row.submitted_at,
  }));

  return {
    stats: {
      total: Number(statsRow.total ?? 0),
      recent: Number(statsRow.recent ?? 0),
      averageAnswers: Number(statsRow.average_answers ?? 0),
      lastSubmission: statsRow.last_submission ?? null,
    },
    submissions,
    query,
    page,
    pageSize: PAGE_SIZE,
    filteredTotal,
    totalPages,
  } satisfies AdminDashboardData;
}

export async function getAdminSubmission(id: string) {
  await requireAdminSession();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await ensureSubmissionTable();

  const sql = database();
  const rows = await sql`
    SELECT
      id,
      questionnaire_version,
      language,
      respondent,
      answers,
      answer_count,
      submitted_at::text AS submitted_at,
      source
    FROM questionnaire_submissions
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = rows[0] as SubmissionRow | undefined;
  if (!row) return null;

  return {
    id: row.id,
    questionnaireVersion: row.questionnaire_version,
    language: row.language,
    respondent: row.respondent ?? {},
    answers: row.answers ?? {},
    answerCount: Number(row.answer_count ?? 0),
    submittedAt: row.submitted_at,
    source: row.source,
  } satisfies AdminSubmission;
}
