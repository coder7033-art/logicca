import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "لوحة متابعة الاستبيانات | LOGICCA",
  description: "لوحة داخلية لمتابعة استبيانات LOGICCA.",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
