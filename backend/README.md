# Personal Hub

A private per-user hub for tracking opportunities, applications, deadlines, follow-ups, and tasks. Each account only sees its own data.

## Stack

- Next.js 16 (UI + API)
- TypeScript
- Neon PostgreSQL
- Drizzle ORM
- Zod validation
- Vercel deployment
- Cookie session auth (per-user isolation)

The frontend and API live in the same Next.js app. Neon stores persistent data; Vercel runs the application.

## Included

- Multi-user login (isolated hubs), logout, and session endpoints
- CLI to create users and set passwords
- Scrypt password hashing
- HttpOnly, Secure, SameSite=Strict session cookie
- Database-backed login throttling
- Opportunities CRUD, search, filters, pagination, deadlines, opening dates, and follow-ups
- Tasks CRUD with optional opportunity linkage
- Dashboard attention queries
- Audit log
- Neon/Drizzle migrations
- Validation and consistent API errors
- Deployment and system documentation

## 1. Local setup

### Requirements

- Node.js 20.9 or newer
- npm
- A Neon PostgreSQL database

### Install

```bash
npm install
cp .env.example .env.local
```

Add your Neon connection string to `.env.local` as `DATABASE_URL`.

Generate an owner password hash:

```bash
npm run auth:hash
```

Copy the output into:

```env
OWNER_PASSWORD_HASH=scrypt:...
```

Generate an authentication secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Set the remaining values:

```env
OWNER_EMAIL=you@example.com
AUTH_SECRET=...
```

Drizzle CLI loads `.env.local` first, so the same file is used by the app and migration commands.

### Create the database schema and first user

```bash
npm run db:migrate
npm run auth:bootstrap
```

`auth:bootstrap` creates your user from `OWNER_EMAIL` / `OWNER_PASSWORD_HASH` and attaches any existing opportunities/tasks to that account.

### Add another person (isolated empty hub)

```bash
npm run auth:create-user
```

### Change a password later

```bash
npm run auth:set-password
```

Login reads password hashes from the `users` table (not from env after bootstrap).

### Verify configuration

```bash
npm run deploy:check
```

### Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000/api/health
```

## 2. Core API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Owner sign-in |
| POST | `/api/auth/logout` | Owner sign-out |
| GET | `/api/auth/session` | Current session |
| GET | `/api/health` | Database health |
| GET/POST | `/api/opportunities` | List/create opportunities |
| GET/PATCH/DELETE | `/api/opportunities/:id` | Opportunity detail |
| GET/POST | `/api/tasks` | List/create tasks |
| GET/PATCH/DELETE | `/api/tasks/:id` | Task detail |
| GET | `/api/dashboard` | Attention-focused dashboard data |

All routes except login and health require the session cookie.

## 3. Database workflow

After changing files under `src/db/schema`:

```bash
npm run db:generate
npm run db:migrate
```

For quick local prototyping only:

```bash
npm run db:push
```

Use generated migrations for production changes.

## 4. Quality checks

```bash
npm run typecheck
npm test
npm run build
```

## 5. Vercel + Neon deployment

1. Push the repository to GitHub.
2. Create/import the project in Vercel.
3. Provision Neon through the Vercel Marketplace or connect an existing Neon project.
4. Add `DATABASE_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD_HASH`, and `AUTH_SECRET` to Vercel Production environment variables.
5. Apply migrations to the production Neon database with `npm run db:migrate` before the first production deployment.
6. Deploy with Vercel's default Next.js build settings.
7. Verify `https://YOUR_DOMAIN/api/health`.
8. Sign in through `/api/auth/login` once the frontend login screen is added.

Do not run database migrations automatically on every preview build unless preview deployments use isolated Neon branches.

See `docs/DEPLOYMENT.md` for the complete deployment process.

## Documentation

- `docs/PROJECT_DESCRIPTION.md`
- `docs/SYSTEM_DESIGN.md`
- `docs/DATABASE_DESIGN.md`
- `docs/API.md`
- `docs/FRONTEND_INTEGRATION.md`
- `docs/QUERY_EXAMPLES.md`
- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
- `docs/TODO.md`
