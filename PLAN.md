# Back Exams — Build Plan

A web app where verified students share past exams, organized by **teacher → course → year/term**, so a student taking Prof. A's class in 2026 can study from the exams Prof. A gave in 2020. Content is student-uploaded; the platform is a host with a report/takedown process. Students at the same school can coordinate via a public request board and per-exam comments.

Decisions below were agreed in conversation. Anything marked *Open* still needs your input.

---

## 1. Decisions so far

| Area | Decision |
|---|---|
| Stack | Next.js (App Router) + TypeScript, Postgres, Prisma ORM |
| Hosting | Vercel (app) + Supabase (Postgres + Storage for exam files) |
| UI | Tailwind CSS + shadcn/ui, neutral look, dark mode, mobile-friendly |
| Auth | Email + password. Signup requires a school email; a 6-digit code is emailed to verify. Email domain determines the school. |
| Scope | Multi-school from day one. Users only see their own school's exams, requests, comments and people. |
| Moderation | Uploads go live immediately. Every exam has Report. Admin queue to hide/delete. Public takedown page + Terms the uploader accepts. |
| Catalog | Uploader searches existing teachers/courses at their school and picks one, or creates a new one. Near-duplicate warning. Admin can merge. |
| Communication (v1) | Public request board, comments on exam and teacher pages, email notifications. No 1:1 DMs in v1 (can add later). |

## 2. Tech choices in detail

- **Next.js 15, App Router, Server Actions** for forms (upload, comment, request). Server Components for pages, so most data fetching is on the server with no client API layer to maintain.
- **Prisma** for schema, migrations and typed queries against Supabase Postgres.
- **Auth: Auth.js (NextAuth v5)** with the Credentials provider + Prisma adapter. We own the password hashing (argon2 via `@node-rs/argon2`) and the verification-code flow. Adding "Sign in with Google" later is a config change, not a rewrite.
- **Email: Resend** (free tier 3k emails/month) with **React Email** templates. Used for verification codes, password reset, and notifications. Locally, emails print to the console.
- **Files: Supabase Storage**, private bucket. Browser uploads directly to Storage via a short-lived signed upload URL (keeps big files off Vercel's 4.5 MB request limit). Downloads use signed URLs that expire in a few minutes and are only issued to a logged-in user from the exam's school.
- **Validation: Zod** on every server action. **Rate limiting** on login/signup/upload via Upstash Redis (free tier) or a simple DB-backed counter to start.
- **Search:** Postgres `pg_trgm` extension for fuzzy teacher/course matching and duplicate warnings. No separate search service.
- **Testing:** Vitest for unit/logic, Playwright for a few end-to-end flows (signup → verify → upload → browse). GitHub Actions runs typecheck, lint, tests on every PR.
- **Local dev:** `docker compose up` gives Postgres; `.env.example` documents every variable. Storage can point at a local Supabase (via Supabase CLI) or the hosted project.

## 3. Data model

```
School          id, name, slug, emailDomains[] (e.g. ["ucla.edu","g.ucla.edu"]), createdAt
User            id, schoolId, email (unique), passwordHash, displayName, major?, gradYear?,
                role (STUDENT | ADMIN), emailVerifiedAt, acceptedTermsAt, createdAt
VerificationCode userId, codeHash, purpose (SIGNUP | RESET), expiresAt, attempts
Department      id, schoolId, name, code (e.g. "CS")
Course          id, schoolId, departmentId?, code ("CS 101"), title, createdById
Teacher         id, schoolId, displayName, normalizedName (for dedupe), departmentId?, createdById
Exam            id, schoolId, courseId, teacherId, uploaderId,
                year, term (FALL | SPRING | SUMMER | WINTER), kind (MIDTERM | FINAL | QUIZ | PRACTICE | OTHER),
                title?, notes?, hasSolutions (bool), status (LIVE | HIDDEN | REMOVED),
                downloadCount, createdAt
ExamFile        id, examId, storagePath, originalName, mimeType, sizeBytes, pageCount?
ExamRequest     id, schoolId, requesterId, courseId?, teacherId?, year?, term?, kind?,
                message, status (OPEN | FULFILLED | CLOSED), fulfilledByExamId?, createdAt
RequestReply    id, requestId, authorId, body, createdAt
Comment         id, schoolId, authorId, body, examId? | teacherId? (one of), parentId?, createdAt, deletedAt?
Report          id, examId | commentId, reporterId, reason (COPYRIGHT | WRONG_INFO | INAPPROPRIATE | OTHER),
                details, status (OPEN | RESOLVED | DISMISSED), resolvedById?, createdAt
Notification    id, userId, type, payload (json), readAt, emailedAt, createdAt
Vote            userId, examId, value (+1 / -1)   — "was this accurate / helpful"
```

Every content table carries `schoolId` so school isolation is one `where` clause and can later be enforced with Postgres row-level security.

## 4. Pages and flows

**Public (logged out)**
- `/` landing: what it is, "Sign up with your school email"
- `/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password`
- `/terms`, `/privacy`, `/takedown` (how to request removal, contact email, what we do within N days)

**Student (logged in, scoped to own school)**
- `/` dashboard: search box, recently added exams, open requests, your notifications
- `/search?q=` unified search over teachers and courses
- `/teachers/[id]` the key page: teacher's exams grouped by course, then by year/term, with comments
- `/courses/[id]` course exams grouped by teacher then year/term
- `/exams/[id]` preview (PDF in-browser), download, metadata, votes, report, comments
- `/upload` multi-step: pick/create course → pick/create teacher → year/term/kind → file(s) → attest & submit
- `/requests` board with filters; `/requests/new`; `/requests/[id]` with replies and "fulfil with an upload" link
- `/notifications`, `/settings` (display name, major, notification prefs, delete account)

**Admin**
- `/admin/reports` queue: view, hide, delete, dismiss
- `/admin/catalog` merge duplicate teachers/courses, edit names
- `/admin/schools` add school, manage email domains

## 5. Security and legal posture

- Passwords hashed with argon2id. Sessions in httpOnly, SameSite=Lax cookies. CSRF handled by Server Actions' origin checks.
- Verification codes: 6 digits, hashed at rest, 10-minute expiry, 5 attempts, resend cooldown.
- Files: allowlist `pdf, png, jpg, jpeg, webp, heic`, max 25 MB/file, up to 5 files per exam. Stored under random keys, served only via signed URLs after a school check. Never public.
- Uploader attestation checkbox: "I am not violating a course policy or honor code I agreed to, and I have the right to share this." Logged with timestamp.
- Takedown page and a `takedown@` contact; reports create an admin task; removed exams keep a tombstone row for audit.
- Rate limits on auth and uploads. Audit log of admin actions.
- No cross-school visibility, no public indexing (`noindex` on all authenticated pages).

## 6. Build phases

Each phase ends with something you can click through on a preview deployment.

1. **Foundation** — repo setup, Next.js + Tailwind + shadcn, Prisma schema + migrations, Docker Postgres, CI, deploy pipeline to Vercel, Supabase project wiring.
2. **Auth** — signup with school-domain check, verification email, login/logout, password reset, terms acceptance, admin role via env var. Seed a first school.
3. **Catalog + browsing** — teachers, courses, search with fuzzy matching, teacher and course pages (empty states).
4. **Uploads** — upload wizard, direct-to-storage upload, exam page with PDF preview and signed download, votes.
5. **Community** — request board, replies, comments on exams/teachers, in-app notifications, email notifications via Resend.
6. **Moderation** — report flow, admin queue, catalog merge, takedown page, audit log.
7. **Polish + launch** — mobile pass, empty/loading states, Playwright flows, analytics (privacy-friendly, e.g. Plausible), error tracking (Sentry).

Rough effort: phases 1–2 first, then 3–4 as the core, 5–6 after. Every phase is a PR against `main`.

## 7. Open questions

- *Open:* App name and domain? (Used in emails, page titles and the storage bucket name.)
- *Open:* Which school seeds first? I need its email domain(s) and a handful of departments to seed for realistic demo data.
- *Open:* Should uploaders be able to stay anonymous to other students (shown as "a student") while admins still see who uploaded? Recommendation: yes, default anonymous.
- *Open:* Allow solutions/answer keys as a separate file on an exam? (Higher legal sensitivity; some schools treat these differently.) Recommendation: allow, clearly labelled, same report flow.
- *Open:* Term naming: Fall/Spring/Summer/Winter covers US semesters and quarters. Do you need anything else (trimesters, "Term 1/2")?
- *Open:* Do you have Vercel/Supabase/Resend accounts already, or should the first phase include a step-by-step setup doc?
