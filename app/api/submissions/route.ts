import { NextResponse } from "next/server";
import { database, ensureSubmissionTable } from "@/lib/db";

export const runtime = "nodejs";

type SubmissionBody = {
  language?: unknown;
  respondent?: unknown;
  answers?: unknown;
  source?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, code: "database_not_configured" },
      { status: 503 },
    );
  }

  try {
    const raw = await request.text();
    if (raw.length > 1_000_000) {
      return NextResponse.json({ ok: false, code: "payload_too_large" }, { status: 413 });
    }

    const body = JSON.parse(raw) as SubmissionBody;
    if (!isRecord(body.respondent) || !isRecord(body.answers)) {
      return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 });
    }

    const name = body.respondent.name;
    const email = body.respondent.email;
    if (typeof name !== "string" || name.trim().length < 2 || !validEmail(email)) {
      return NextResponse.json({ ok: false, code: "invalid_respondent" }, { status: 400 });
    }

    const language = body.language === "en" ? "en" : "ar";
    const id = crypto.randomUUID();
    const answerCount = Object.values(body.answers).filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== "" && value !== null && value !== undefined;
    }).length;

    await ensureSubmissionTable();
    const sql = database();
    await sql`
      INSERT INTO questionnaire_submissions (
        id,
        questionnaire_version,
        language,
        respondent,
        answers,
        answer_count,
        user_agent,
        source
      ) VALUES (
        ${id},
        ${"5.0"},
        ${language},
        ${JSON.stringify(body.respondent)}::jsonb,
        ${JSON.stringify(body.answers)}::jsonb,
        ${answerCount},
        ${request.headers.get("user-agent") ?? ""},
        ${typeof body.source === "string" ? body.source.slice(0, 40) : "web"}
      )
    `;

    return NextResponse.json({ ok: true, reference: id });
  } catch (error) {
    console.error("Questionnaire submission failed", error);
    return NextResponse.json({ ok: false, code: "submission_failed" }, { status: 500 });
  }
}
