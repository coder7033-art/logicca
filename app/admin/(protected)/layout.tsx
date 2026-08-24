import Image from "next/image";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAdminSession();

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link href="/admin" className="admin-brand" aria-label="لوحة متابعة LOGICCA">
            <Image src="/assets/logicca_logo.png" alt="LOGICCA" width={132} height={39} priority />
            <span />
            <div>
              <strong>لوحة متابعة الاستبيانات</strong>
              <small>مساحة داخلية</small>
            </div>
          </Link>

          <form action="/api/admin/logout" method="post">
            <button type="submit" className="admin-logout-button">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
