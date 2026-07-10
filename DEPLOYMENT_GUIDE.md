# دليل النشر والتوزيع المجاني

هذا الدليل يشرح كيفية نشر مشروع نظام إدارة حلقات التحفيظ على منصات مجانية بالكامل.

## المكونات المستخدمة

- **Frontend:** Netlify (مجاني)
- **Backend:** Render.com (مجاني)
- **Database:** Neon.tech (مجاني)

---

## الخطوة 1: إعداد قاعدة البيانات (Neon)

### تم بالفعل ✅
لديك بالفعل رابط قاعدة البيانات:
```
postgresql://neondb_owner:npg_n34dGhBwrzlq@ep-twilight-star-atjs6sz8.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## الخطوة 2: نشر الـ Backend على Render.com

### أ) إنشاء حساب على Render
1. اذهب إلى [render.com](https://render.com)
2. اضغط على **Sign Up** واختر **GitHub**
3. أعطه صلاحيات الوصول إلى مستودعك

### ب) إنشاء خدمة جديدة
1. من لوحة التحكم، اضغط على **New +**
2. اختر **Web Service**
3. اختر مستودع **Quran-Circle-Manager**
4. ملأ البيانات:
   - **Name:** quran-circle-api
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm run start`
   - **Plan:** Free

### ج) إضافة متغيرات البيئة
في قسم **Environment Variables**، أضف:
```
DATABASE_URL=postgresql://neondb_owner:npg_n34dGhBwrzlq@ep-twilight-star-atjs6sz8.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=your-secret-key-here-change-this
NODE_ENV=production
```

### د) النشر
اضغط على **Create Web Service** وانتظر النشر (قد يستغرق 5-10 دقائق)

**ستحصل على رابط مثل:** `https://quran-circle-api.onrender.com`

---

## الخطوة 3: نشر الـ Frontend على Netlify

### أ) إنشاء حساب على Netlify
1. اذهب إلى [netlify.com](https://netlify.com)
2. اضغط على **Sign Up** واختر **GitHub**
3. أعطه صلاحيات الوصول

### ب) ربط المستودع
1. من لوحة التحكم، اضغط على **Add new site**
2. اختر **Import an existing project**
3. اختر **GitHub** وابحث عن **Quran-Circle-Manager**
4. اضغط **Connect**

### ج) إعدادات البناء
- **Build command:** `pnpm install && pnpm run build`
- **Publish directory:** `artifacts/hifz-app/dist/public`

### د) متغيرات البيئة
أضف في **Site settings > Build & deploy > Environment**:
```
PORT=3000
BASE_PATH=/
VITE_API_URL=https://quran-circle-api.onrender.com
```

### هـ) النشر
اضغط على **Deploy site** وانتظر النشر

**ستحصل على رابط مثل:** `https://quran-circle-manager.netlify.app`

---

## الخطوة 4: تحديث رابط الـ API في الكود

تأكد من أن الكود يستخدم الرابط الصحيح للـ API:

في ملف `artifacts/hifz-app/src/lib/api-client.ts` (أو ما شابه):
```typescript
const API_URL = process.env.VITE_API_URL || 'https://quran-circle-api.onrender.com';
```

---

## الخطوة 5: النشر المستمر (CI/CD)

تم إعداد GitHub Actions لتوزيع تلقائي عند كل push:

1. اذهب إلى **Settings > Secrets and variables > Actions**
2. أضف الـ Secrets التالية:
   - `NETLIFY_AUTH_TOKEN` - من [netlify.com/user/applications](https://app.netlify.com/user/applications)
   - `NETLIFY_SITE_ID` - من إعدادات موقعك على Netlify
   - `RENDER_SERVICE_ID` - من رابط خدمتك على Render
   - `RENDER_API_KEY` - من إعدادات حسابك على Render

---

## الخطوة 6: ترحيل البيانات (اختياري)

إذا كان لديك بيانات قديمة من Replit:

```bash
# تصدير البيانات من Replit
pg_dump old_database > backup.sql

# استيراد البيانات إلى Neon
psql postgresql://neondb_owner:npg_n34dGhBwrzlq@ep-twilight-star-atjs6sz8.c-9.us-east-1.aws.neon.tech/neondb < backup.sql
```

---

## الخطوة 7: اختبار الموقع

بعد النشر:
1. افتح رابط Netlify الخاص بك
2. تأكد من أن الموقع يحمل بشكل صحيح
3. جرب تسجيل الدخول والعمليات الأساسية

---

## استكشاف الأخطاء

### الموقع لا يحمل
- تحقق من أن رابط الـ API صحيح في متغيرات البيئة
- تحقق من أن Render API يعمل

### خطأ في قاعدة البيانات
- تحقق من أن `DATABASE_URL` صحيح
- تأكد من أن جداول قاعدة البيانات تم إنشاؤها

### مشاكل في البناء
- تحقق من السجلات (Logs) على Netlify و Render
- تأكد من أن جميع الـ Dependencies مثبتة

---

## معلومات مهمة

- **الخطة المجانية على Render:** تتوقف الخدمة بعد 15 دقيقة من عدم الاستخدام
- **الخطة المجانية على Neon:** تتضمن 3 مشاريع و 10GB تخزين
- **الخطة المجانية على Netlify:** تتضمن 300 دقيقة بناء شهرياً

---

## الدعم والمساعدة

للمزيد من المعلومات:
- Netlify Docs: https://docs.netlify.com
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
