# نظام إدارة حلقات التحفيظ

نظام متكامل لإدارة حلقات تحفيظ القرآن الكريم — يدير الحضور، التسميع، وتقارير PDF.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/hifz-app run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Arabic RTL, Tajawal font
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: Session-based (sha256 password hash with salt)
- PDF: window.print() with @media print CSS

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: users, circles, students, attendance, recitations
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/hifz-app/src/` — React frontend (Arabic RTL)

## Architecture decisions

- Session auth via express-session (cookie-based, 7-day sessions)
- Password hashing: sha256 with fixed salt (no bcrypt for simplicity, can be upgraded)
- Morning-afternoon teacher link: stored on the student record at registration (`afternoonTeacherId`)
- Attendance is batch-recorded per circle per day (upsert semantics)
- PDF export uses `window.print()` with `@media print` CSS — no server-side PDF generation needed
- All UI text is Arabic; full RTL direction on the `<html>` element

## Product

- **Supervisors**: see everything — all circles, all students, all teachers, full reports
- **Morning teachers**: record attendance and recitation for their circle students
- **Afternoon teachers**: view their students' morning performance; print one-click report per date range

## User preferences

- Arabic RTL interface throughout
- Mobile-first (teachers/supervisors use phones)
- PDF reports must be printable and clean
- Server must always be running (no cold starts)

## Default credentials (demo data)

| المستخدم | كلمة المرور | الدور |
|---------|-------------|-------|
| admin | admin123 | مشرف |
| abdullah | teacher123 | مدرس صباحي (حلقة الفجر) |
| mohammed | teacher123 | مدرس صباحي (حلقة الضحى) |
| saad | teacher123 | مدرس صباحي (حلقة النور) |
| saleh | teacher123 | مدرس مسائي |
| faisal | teacher123 | مدرس مسائي |

## Gotchas

- Run codegen after every OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- Run DB push after schema changes: `pnpm --filter @workspace/db run push`
- The API server must be running for the frontend to work (they are separate workflows)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
