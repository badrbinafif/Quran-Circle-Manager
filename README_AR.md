# نظام إدارة حلقات التحفيظ - دليل البدء السريع

## 🎯 ملخص المشروع

هذا المشروع عبارة عن نظام ويب متكامل لإدارة حلقات تحفيظ القرآن الكريم، يتضمن:
- **إدارة الطلاب والمعلمين**
- **تتبع الحضور والغياب**
- **تسجيل التسميع والدرجات**
- **تقارير شاملة عن التقدم**

---

## 🚀 النشر المجاني

تم تجهيز المشروع للنشر المجاني على:
- **Frontend:** Netlify
- **Backend:** Render.com
- **Database:** Neon.tech

**اتبع دليل النشر الكامل في ملف `DEPLOYMENT_GUIDE.md`**

---

## 📋 المتطلبات

- Node.js 22 أو أحدث
- pnpm (مدير الحزم)
- حساب على GitHub

---

## 🛠️ التطوير المحلي

### التثبيت
```bash
# استنساخ المشروع
git clone https://github.com/badrbinafif/Quran-Circle-Manager.git
cd Quran-Circle-Manager

# تثبيت الـ Dependencies
pnpm install
```

### إعداد البيئة
```bash
# نسخ ملف البيئة
cp .env.example .env

# تحديث DATABASE_URL بقاعدة بيانات محلية أو Neon
```

### التشغيل
```bash
# تشغيل الـ Frontend والـ Backend معاً
pnpm run dev
```

---

## 📁 هيكل المشروع

```
Quran-Circle-Manager/
├── artifacts/
│   ├── hifz-app/          # Frontend (React + Vite)
│   ├── api-server/        # Backend (Express)
│   └── mockup-sandbox/    # Mockup للتصميم
├── lib/
│   ├── db/                # قاعدة البيانات (Drizzle ORM)
│   ├── api-spec/          # OpenAPI Specification
│   ├── api-client-react/  # React API Client
│   └── api-zod/           # Zod Validation
├── scripts/               # Scripts مساعدة
├── netlify.toml          # إعدادات Netlify
├── render.yaml           # إعدادات Render
└── DEPLOYMENT_GUIDE.md   # دليل النشر الكامل
```

---

## 🔧 الأوامر المتاحة

```bash
# البناء والاختبار
pnpm run build          # بناء المشروع
pnpm run typecheck      # فحص الأنواع (TypeScript)

# التطوير
pnpm run dev            # تشغيل وضع التطوير

# النشر
pnpm run start          # تشغيل الـ Backend في الإنتاج
```

---

## 🗄️ قاعدة البيانات

المشروع يستخدم **PostgreSQL** مع **Drizzle ORM**.

### الجداول الرئيسية
- `users` - المستخدمون (معلمون وإداريون)
- `circles` - الحلقات
- `students` - الطلاب
- `teachers` - المعلمون
- `attendance` - سجلات الحضور
- `recitations` - سجلات التسميع

---

## 🔐 الأمان

- استخدام **Session-based Authentication**
- تشفير كلمات المرور
- CORS مفعل للطلبات الآمنة
- متغيرات البيئة للبيانات الحساسة

---

## 📞 الدعم والمساعدة

للمزيد من المعلومات:
- 📖 اقرأ `DEPLOYMENT_GUIDE.md` لتفاصيل النشر
- 🐛 ابحث عن الأخطاء في GitHub Issues
- 💬 تواصل عبر البريد الإلكتروني

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License

---

**تم إعداد هذا المشروع بواسطة Manus AI**
