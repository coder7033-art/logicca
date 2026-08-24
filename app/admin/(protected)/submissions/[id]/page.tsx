import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminResponseViewer } from "@/components/admin-response-viewer";
import { getAdminSubmission } from "@/lib/admin-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

function respondentValue(value: string | undefined) {
  return value?.trim() || "—";
}

export default async function AdminSubmissionPage({ params }: PageProps<"/admin/submissions/[id]">) {
  const { id } = await params;
  const submission = await getAdminSubmission(id);
  if (!submission) notFound();

  return (
    <main className="admin-main admin-detail-main">
      <div className="admin-container">
        <div className="admin-detail-nav">
          <Link href="/admin">← العودة إلى كل الاستبيانات</Link>
          <span>تم الاستلام {formatDate(submission.submittedAt)}</span>
        </div>

        <section className="admin-detail-heading">
          <div>
            <span className="admin-eyebrow">استبيان مستلم</span>
            <h1>{respondentValue(submission.respondent.name)}</h1>
            <p>راجع بيانات المشارك وكل الإجابات المسجلة في الأقسام العشرة.</p>
          </div>
          <div className="admin-reference-block">
            <span>الرقم المرجعي</span>
            <strong dir="ltr">{submission.id}</strong>
          </div>
        </section>

        <section className="admin-respondent-card">
          <div>
            <span>الاسم</span>
            <strong>{respondentValue(submission.respondent.name)}</strong>
          </div>
          <div>
            <span>المنصب / الإدارة</span>
            <strong>{respondentValue(submission.respondent.role)}</strong>
          </div>
          <div>
            <span>البريد الإلكتروني</span>
            <strong dir="ltr">{respondentValue(submission.respondent.email)}</strong>
          </div>
          <div>
            <span>تاريخ الاستبيان</span>
            <strong>{respondentValue(submission.respondent.date)}</strong>
          </div>
          <div>
            <span>الإجابات المسجلة</span>
            <strong>{submission.answerCount.toLocaleString("ar-EG")}</strong>
          </div>
          <div>
            <span>لغة الإجابة</span>
            <strong>{submission.language === "ar" ? "العربية" : "English"}</strong>
          </div>
        </section>

        <AdminResponseViewer
          language={submission.language}
          respondent={submission.respondent}
          answers={submission.answers}
        />
      </div>
    </main>
  );
}
