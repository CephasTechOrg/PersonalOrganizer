# API Reference

All request and response bodies use JSON. Successful responses use `{ "data": ... }`. List endpoints also include `meta` pagination information.

## Authentication

### `POST /api/auth/login`

```json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

Sets an HttpOnly session cookie.

### `GET /api/auth/session`

Returns the authenticated owner.

### `POST /api/auth/logout`

Clears the session cookie.

## Opportunities

### `GET /api/opportunities`

Supported query parameters:

- `page`
- `limit`
- `q`
- `status`
- `type`
- `priority`
- `deadlineBefore`
- `deadlineAfter`
- `sort=deadline|created|updated|title`
- `order=asc|desc`

Example:

```text
/api/opportunities?status=need_to_apply&sort=deadline&order=asc
```

### `POST /api/opportunities`

```json
{
  "title": "Example Fellowship",
  "organization": "Example Foundation",
  "type": "fellowship",
  "status": "need_to_apply",
  "priority": "high",
  "sourceUrl": "https://example.com/program",
  "applicationUrl": "https://example.com/apply",
  "deadlineAt": "2026-09-01T23:59:00-04:00",
  "nextAction": "Finish personal statement"
}
```

### `PATCH /api/opportunities/:id`

Send only changed fields.

```json
{
  "status": "applied",
  "followUpAt": "2026-09-15T09:00:00-04:00"
}
```

When an opportunity enters an applied-or-later status, `appliedAt` is automatically populated if it was not supplied.

### `DELETE /api/opportunities/:id`

Deletes the opportunity and linked tasks.

## Tasks

### `GET /api/tasks`

Supported query parameters:

- `page`
- `limit`
- `q`
- `status`
- `priority`
- `kind`
- `opportunityId`
- `dueBefore`
- `dueAfter`
- `sort=due|created|updated|title`
- `order=asc|desc`

### `POST /api/tasks`

```json
{
  "opportunityId": "optional-uuid",
  "title": "Download transcript",
  "kind": "download",
  "actionUrl": "https://example.edu/transcript",
  "priority": "high",
  "dueAt": "2026-08-25T18:00:00-04:00"
}
```

### `PATCH /api/tasks/:id`

```json
{
  "status": "done"
}
```

`completedAt` is populated automatically when status becomes `done`.

## Dashboard

### `GET /api/dashboard`

Returns:

```json
{
  "data": {
    "generatedAt": "...",
    "counts": {},
    "overdueCount": 0,
    "needsAttention": [],
    "overdue": [],
    "dueSoon": [],
    "followUps": [],
    "overdueTasks": [],
    "upcomingTasks": []
  }
}
```

## Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

Common codes:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `RATE_LIMITED`
- `INTERNAL_ERROR`
