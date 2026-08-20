# LOGICCA Client Questionnaire — Next.js

نسخة Next.js احترافية من استبيان LOGICCA، عربية افتراضيًا مع دعم English، وخط Cairo، وحفظ تلقائي للمسودة، وتنقّل مباشر بين الأقسام، ومراجعة قبل الإرسال، وحفظ النتائج في Neon PostgreSQL. زر مسح الإجابات يحذف المسودة المحلية وأي إرسال مرتبط بها من Neon باستخدام مفتاح حذف خاص بالجهاز.

## التشغيل محليًا

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:3000`.

## إعداد Neon

1. انسخ `.env.example` إلى `.env.local`.
2. ضع رابط Neon الكامل في `DATABASE_URL`. يجب أن يحتوي الرابط على اسم المستخدم وكلمة المرور.
3. أعد تشغيل خادم التطوير.

يُنشئ مسار الإرسال جدول `questionnaire_submissions` تلقائيًا عند أول عملية إرسال. ويمكن أيضًا تشغيل `db/schema.sql` يدويًا من Neon SQL Editor.

## النشر على Vercel

1. ارفع المشروع إلى GitHub أو استورده مباشرة في Vercel.
2. اترك Framework Preset على `Next.js`.
3. أضف `DATABASE_URL` في **Project Settings → Environment Variables** لبيئات Production وPreview وDevelopment حسب الحاجة.
4. نفّذ النشر. أمر البناء هو `npm run build`.

لا تضع رابط قاعدة البيانات الحقيقي في الملفات العامة أو في متغير يبدأ بـ `NEXT_PUBLIC_`.

## الأوامر

```bash
npm run dev        # Development
npm run db:init    # Create / verify the Neon table and indexes
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # Production build
npm run start      # Run production build
```

## البنية الرئيسية

- `app/` — صفحات Next.js ومسار API.
- `components/questionnaire-app.tsx` — تجربة الاستبيان والتخزين المحلي والمراجعة.
- `lib/questionnaire-renderer.ts` — المحتوى الثنائي اللغة المنقول من النسخة المعتمدة v4.
- `lib/db.ts` — اتصال Neon من الخادم فقط.
- `db/schema.sql` — مخطط PostgreSQL.
- `public/assets/` — شعار LOGICCA.

الملفات HTML القديمة موجودة كمرجع فقط ولا تدخل في تشغيل تطبيق Next.js.
