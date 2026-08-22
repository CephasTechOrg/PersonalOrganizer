# Deployment

## Target

- Application runtime: Vercel
- Database: Neon PostgreSQL
- Framework: Next.js
- Runtime for API routes: Node.js

## Recommended production path

### 1. Create the Neon database

Create a Neon project directly or install the Neon native integration from the Vercel Marketplace.

Copy the Postgres connection string.

### 2. Configure local production credentials

Create a temporary local `.env` file containing the production values:

```env
DATABASE_URL=...
OWNER_EMAIL=...
OWNER_PASSWORD_HASH=...
AUTH_SECRET=...
```

Do not commit this file.

### 3. Apply migrations

```bash
npm install
npm run db:generate
npm run db:migrate
npm run deploy:check
```

### 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial personal hub backend"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

### 5. Import into Vercel

Import the GitHub repository. Vercel should detect Next.js automatically.

Use the standard commands:

```text
Build Command: next build
Install Command: npm install
Output: automatic
```

No custom `vercel.json` is required.

### 6. Add environment variables

In Vercel Project Settings -> Environment Variables, add:

- `DATABASE_URL`
- `OWNER_EMAIL`
- `OWNER_PASSWORD_HASH`
- `AUTH_SECRET`

Set them for Production. Add separate values for Preview only if you intentionally support preview deployments.

Redeploy after changing environment variables.

### 7. Verify

Open:

```text
https://YOUR_DOMAIN/api/health
```

Expected shape:

```json
{
  "data": {
    "status": "ok",
    "database": "reachable"
  }
}
```

Then test login with the frontend or an HTTP client.

## Vercel CLI alternative

```bash
npm install -g vercel
vercel
vercel --prod
```

If the Neon integration has injected variables into Vercel, pull them locally when needed:

```bash
vercel env pull .env.local
```

## Migrations and deployments

Do not blindly run migrations in every Vercel preview build against one shared production database.

Preferred options:

1. Apply production migrations explicitly before deployment.
2. If using Neon preview branches, migrate each isolated preview database as part of its preview workflow.

## Rollback

Application rollback is handled through Vercel deployment history.

Database rollback should be handled through a deliberate migration or Neon recovery/branching capability. Never edit an already-applied migration file.
