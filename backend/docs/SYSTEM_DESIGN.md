# System Design

## Architecture

```text
Browser / React UI
        |
        | HTTPS + same-origin cookie
        v
Next.js on Vercel
  - Route handlers
  - Validation
  - Auth/session checks
  - Business services
        |
        | Neon serverless connection
        v
Neon PostgreSQL
```

## Deployment model

The application is one Next.js project deployed to Vercel. The React frontend and backend routes share the same origin. Neon is the persistent PostgreSQL database.

This avoids a separate API host, CORS configuration, and a continuously running backend server.

## Code organization

The backend is feature-oriented:

```text
src/features/
  auth/
  opportunities/
  tasks/
  dashboard/
  audit/
```

Each feature owns its validation and service logic. Shared infrastructure is under `src/lib`. Database definitions are under `src/db/schema`.

Route handlers remain thin. Their responsibility is:

1. Authenticate.
2. Validate transport input.
3. Call a service.
4. Return a normalized response.

Business logic does not live in route files.

## Request lifecycle

```text
Request
  -> session validation
  -> Zod validation
  -> feature service
  -> Drizzle query
  -> Neon PostgreSQL
  -> normalized JSON response
```

## Opportunity workflow

```text
saved
  -> need_to_apply
  -> in_progress
  -> applied
  -> waiting
  -> interview
  -> accepted / rejected / withdrawn
  -> archived
```

The workflow is intentionally permissive. The backend does not force every transition because real opportunities do not always follow the same sequence.

## Task workflow

```text
todo -> in_progress -> done
                  \-> cancelled
```

A task may exist independently or reference an opportunity.

## Dashboard logic

The dashboard aggregates:

- opportunity counts by status
- overdue active opportunities
- opportunities due within seven days
- due follow-ups for applied/waiting opportunities
- tasks due within seven days

The frontend can therefore render "Needs Attention" without duplicating scheduling logic.

## Scalability

This design is intentionally small but structurally sound:

- Stateless application runtime
- Persistent managed Postgres
- Indexed deadline/status fields
- Server-side pagination
- Feature boundaries
- Migration history

For a single-user application, this has significant headroom without additional infrastructure.
