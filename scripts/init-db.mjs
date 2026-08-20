import { readFile } from "node:fs/promises";
import process from "node:process";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

const [status] = await sql.query(`
  SELECT
    to_regclass('public.questionnaire_submissions') AS table_name,
    (SELECT COUNT(*)::int FROM questionnaire_submissions) AS row_count
`);

console.log(
  JSON.stringify({
    ok: true,
    statements: statements.length,
    table: status.table_name,
    rowCount: status.row_count,
  }),
);
