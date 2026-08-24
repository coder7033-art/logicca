import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin-data";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  if (!value) return "لا توجد ردود بعد";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

function pageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `/admin?${suffix}` : "/admin";
}

export default async function AdminDashboardPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const query = firstValue(params.q) ?? "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const data = await getAdminDashboardData(query, requestedPage);
  const start = data.filteredTotal === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const end = Math.min(data.page * data.pageSize, data.filteredTotal);

  return (
    <main className="admin-main">
      <div className="admin-container">
        <section className="admin-intro">
          <div>
            <span className="admin-eyebrow">نظرة تشغيلية</span>
            <h1>الاستبيانات المستلمة</h1>
            <p>تابع الردود وافتح أي استبيان لمراجعة إجابات العميل بالتفصيل.</p>
          </div>
          <div className="admin-live-badge"><span /> بيانات مباشرة من Neon</div>
        </section>

        <section className="admin-stats" aria-label="ملخص الاستبيانات">
          <article>
            <span>إجمالي الاستبيانات</span>
            <strong>{data.stats.total.toLocaleString("ar-EG")}</strong>
            <small>كل الردود المستلمة</small>
          </article>
          <article>
            <span>آخر 7 أيام</span>
            <strong>{data.stats.recent.toLocaleString("ar-EG")}</strong>
            <small>ردود حديثة</small>
          </article>
          <article>
            <span>متوسط الإجابات</span>
            <strong>{data.stats.averageAnswers.toLocaleString("ar-EG")}</strong>
            <small>إجابة لكل استبيان</small>
          </article>
          <article className="admin-stat-date">
            <span>آخر استبيان</span>
            <strong>{formatDate(data.stats.lastSubmission)}</strong>
            <small>بتوقيت دبي</small>
          </article>
        </section>

        <section className="admin-list-card">
          <div className="admin-list-head">
            <div>
              <h2>سجل الردود</h2>
              <p>{data.filteredTotal.toLocaleString("ar-EG")} نتيجة</p>
            </div>
            <form action="/admin" method="get" className="admin-search-form">
              <label htmlFor="admin-search" className="sr-only">البحث في الردود</label>
              <input
                id="admin-search"
                name="q"
                type="search"
                defaultValue={data.query}
                placeholder="ابحث بالاسم أو البريد أو الرقم المرجعي"
              />
              <button type="submit">بحث</button>
              {data.query && <Link href="/admin" className="admin-clear-search">مسح</Link>}
            </form>
          </div>

          {data.submissions.length > 0 ? (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>المشارك</th>
                      <th>البريد الإلكتروني</th>
                      <th>تاريخ الاستلام</th>
                      <th>الإجابات</th>
                      <th>اللغة</th>
                      <th><span className="sr-only">فتح</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>
                          <strong>{submission.respondentName}</strong>
                          <small>{submission.respondentRole}</small>
                        </td>
                        <td dir="ltr">{submission.respondentEmail}</td>
                        <td>{formatDate(submission.submittedAt)}</td>
                        <td><span className="admin-count-chip">{submission.answerCount.toLocaleString("ar-EG")}</span></td>
                        <td>{submission.language === "ar" ? "العربية" : "English"}</td>
                        <td>
                          <Link href={`/admin/submissions/${submission.id}`} className="admin-open-link">
                            عرض التفاصيل
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <span>عرض {start.toLocaleString("ar-EG")}–{end.toLocaleString("ar-EG")} من {data.filteredTotal.toLocaleString("ar-EG")}</span>
                <div>
                  {data.page > 1 ? <Link href={pageHref(data.page - 1, data.query)}>السابق</Link> : <span>السابق</span>}
                  <b>{data.page.toLocaleString("ar-EG")} / {data.totalPages.toLocaleString("ar-EG")}</b>
                  {data.page < data.totalPages ? <Link href={pageHref(data.page + 1, data.query)}>التالي</Link> : <span>التالي</span>}
                </div>
              </div>
            </>
          ) : (
            <div className="admin-empty-state">
              <span>0</span>
              <h3>{data.query ? "لا توجد نتائج مطابقة" : "لا توجد استبيانات حتى الآن"}</h3>
              <p>{data.query ? "جرّب البحث باسم أو بريد مختلف." : "ستظهر ردود العملاء هنا فور إرسال الاستبيان."}</p>
              {data.query && <Link href="/admin">عرض كل الردود</Link>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
