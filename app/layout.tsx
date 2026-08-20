import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo";
import "./globals.css";

export const metadata: Metadata = {
  title: "استبيان الأعمال والعمليات | LOGICCA",
  description: "استبيان LOGICCA لفهم العمليات والخدمات الحالية.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2f45",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
