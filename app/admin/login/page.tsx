import Image from "next/image";
import { redirect } from "next/navigation";
import { adminAuthIsConfigured, hasAdminSession } from "@/lib/admin-auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

const errorMessages: Record<string, string> = {
  credentials: "اسم المستخدم أو كلمة المرور غير صحيحة.",
  configuration: "بيانات دخول لوحة الإدارة غير مكتملة على الخادم.",
  request: "تعذر تسجيل الدخول الآن. حاول مرة أخرى.",
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await hasAdminSession()) redirect("/admin");

  const params = await searchParams;
  const errorCode = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorMessage = errorCode ? errorMessages[errorCode] : undefined;
  const configured = adminAuthIsConfigured();

  return (
    <main className="admin-login-page">
      <div className="admin-login-frame">
        <div className="admin-login-brand">
          <Image src="/assets/logicca_logo.png" alt="LOGICCA" width={154} height={46} priority />
          <span>مساحة داخلية محمية</span>
        </div>

        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <div className="admin-login-heading">
            <span className="admin-eyebrow">لوحة الإدارة</span>
            <h1 id="admin-login-title">تسجيل الدخول</h1>
            <p>أدخل بيانات الإدارة لعرض الاستبيانات المستلمة.</p>
          </div>

          {(errorMessage || !configured) && (
            <div className="admin-alert" role="alert">
              {errorMessage ?? "بيانات دخول لوحة الإدارة غير مكتملة على الخادم."}
            </div>
          )}

          <form action="/api/admin/login" method="post" className="admin-login-form">
            <label htmlFor="admin-username">اسم المستخدم</label>
            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              autoFocus
              disabled={!configured}
            />

            <label htmlFor="admin-password">كلمة المرور</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!configured}
            />

            <button type="submit" disabled={!configured}>دخول آمن</button>
          </form>
        </section>

        <p className="admin-login-footnote">هذه الصفحة غير مخصصة للعملاء ولا تظهر داخل الاستبيان.</p>
      </div>
    </main>
  );
}
