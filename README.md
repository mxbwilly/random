# BackExams

A student-run archive of past exams, organized by **teacher → course → year/term**, with a request board and comments so students at the same school can help each other find what they need. Only verified students of a school can see that school's content.

See [PLAN.md](./PLAN.md) for the full product and technical plan.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 + shadcn/ui · Prisma 7 · Postgres · Resend (email) · Supabase Storage (files) · Vercel (hosting)

## Local development

Prerequisites: Node 22+, and either Docker or a local Postgres 14+.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # edit DATABASE_URL if you're not using docker compose
docker compose up -d             # starts Postgres on localhost:5432
npm run db:migrate               # applies migrations
npm run db:seed                  # creates Demo University + demo accounts
npm run dev                      # http://localhost:3000
```

Demo accounts after seeding (school domain `demo.edu`):

| Email | Password | Role |
|---|---|---|
| `student@demo.edu` | `password1234` | Student |
| `admin@demo.edu` | `password1234` | Admin |

Without a `RESEND_API_KEY`, verification and reset emails are **printed to the terminal** running `npm run dev`, so you can sign up with any `@demo.edu` (or `@anything.demo.edu`) address locally.

If port 5432 is already taken (a Postgres you installed earlier, for example), set `DB_PORT=5433` in `.env` and change the port in `DATABASE_URL` to match before `docker compose up -d`.

Useful scripts: `npm run typecheck`, `npm run lint`, `npm test` (unit), `npm run e2e` (browser tests, see below), `npm run db:studio` (Prisma Studio GUI).

## Browser tests

`npm run e2e` builds the app, starts it on port 3100 with a test mailbox enabled, and runs the Playwright suite in `e2e/` against your local database (which must be migrated and seeded). CI runs the same suite on every pull request. `npm run e2e:ui` opens Playwright's interactive runner. First time only: `npx playwright install chromium`.

## Optional services

- **Sentry** (error tracking): set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`. Nothing is initialised without them.
- **Plausible** (privacy-friendly analytics): set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to your site's domain.

## Project layout

```
prisma/schema.prisma      data model (Prisma)
prisma/migrations/        SQL migrations, applied with `prisma migrate`
prisma/seed.ts            demo data
src/app/(auth)/           login, signup, verify, password reset (+ actions.ts)
src/app/(app)/            everything behind login, scoped to the user's school
src/app/(legal)/          terms, privacy, takedown
src/lib/auth/             sessions, password hashing, verification codes, school lookup
src/lib/email/            email sending (Resend, or console in dev)
src/components/ui/        shadcn/ui components
src/proxy.ts              redirects logged-out visitors away from app routes
e2e/                      Playwright browser tests (npm run e2e)
```

## Setting up hosting (first time)

You need three free accounts. Roughly 30 minutes total.

### 1. Supabase (database + file storage)

1. Create an account at supabase.com and a new project. Pick a region close to your users and save the database password.
2. In **Project Settings → Database**, copy the **connection string (URI)**, choosing the *Transaction* pooler on port 6543 for Vercel. Put it in `DATABASE_URL`.
3. In **Storage**, create a **private** bucket named `exams`.
4. In **Project Settings → API**, copy the **Project URL** into `SUPABASE_URL` and the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`. Never expose the service role key to the browser.
5. Run the migrations against it once: `DATABASE_URL="<your uri>" npx prisma migrate deploy`.

### 2. Resend (email)

1. Create an account at resend.com.
2. Add and verify your domain (DNS records shown in their dashboard). Until then you can only send to your own address.
3. Create an API key and put it in `RESEND_API_KEY`. Set `EMAIL_FROM` to an address on the verified domain, e.g. `BackExams <noreply@yourdomain.com>`.

### 3. Vercel (hosting)

1. Create an account at vercel.com and **Import** this GitHub repository.
2. Framework preset: Next.js (auto-detected). Build command: `npm run build`.
3. Add every variable from `.env.example` under **Settings → Environment Variables**, with production values. Set `APP_URL` to your Vercel URL or custom domain and `ADMIN_EMAILS` to your own school email.
4. Deploy. Every pull request gets a preview URL automatically.

### 4. Add your school

Insert a row in the `School` table (Supabase → Table editor, or Prisma Studio) with the school's name, a slug, and its email domains, e.g. `{"ucla.edu","g.ucla.edu"}`. Sign up with an address on that domain, and because it's listed in `ADMIN_EMAILS` you'll be an admin.

## Legal posture

All content is user-uploaded. The app requires an attestation at upload time, provides a Report button on every exam, an admin queue, and a public [takedown page](/takedown). Review `src/app/(legal)` with a lawyer before launch and replace the placeholder contact address.
