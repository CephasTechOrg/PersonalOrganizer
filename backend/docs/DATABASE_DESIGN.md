# Database Design

## Tables

### `opportunities`

The primary application record.

Important fields:

| Field | Meaning |
|---|---|
| `title` | Opportunity name |
| `organization` | Company or program owner |
| `type` | Internship, fellowship, program, funding, etc. |
| `status` | Current lifecycle state |
| `priority` | Personal urgency |
| `source_url` | Information/source page |
| `application_url` | Direct application page |
| `deadline_at` | Submission deadline |
| `follow_up_at` | Date to revisit after applying |
| `next_action` | Short action instruction |
| `applied_at` | Application timestamp |
| `archived_at` | Archive timestamp |

Indexes exist on status, type, deadline, follow-up date, and creation date.

### `tasks`

Action items. A task can optionally reference an opportunity.

Examples:

- Finish BlackRock video interview
- Download transcript
- Rewrite essay paragraph
- Follow up with recruiter

Tasks also store a `kind` and optional `action_url`, allowing the frontend to distinguish actions such as Apply, Download, Review, Contact, Attend, or Complete.

Deleting an opportunity cascades to its linked tasks.

### `audit_logs`

Append-only operational history for opportunity, task, and authentication actions.

It is intentionally generic so future features can use the same logging mechanism.

### `auth_throttles`

Stores temporary login attempt state. The key is an HMAC of IP address and attempted email, so raw IP addresses are not persisted.

## Enums

### Opportunity type

- `internship`
- `fellowship`
- `program`
- `startup_program`
- `funding`
- `competition`
- `event`
- `other`

### Opportunity status

- `saved`
- `need_to_apply`
- `in_progress`
- `applied`
- `waiting`
- `interview`
- `accepted`
- `rejected`
- `withdrawn`
- `archived`

### Priority

- `low`
- `normal`
- `high`
- `urgent`

### Task kind

- `apply`
- `download`
- `review`
- `contact`
- `attend`
- `complete`
- `other`

### Task status

- `todo`
- `in_progress`
- `done`
- `cancelled`

## Future schema changes

Do not add new tables until a real workflow requires them. Likely future tables are:

- `tags`
- `opportunity_tags`
- `attachments`
- `reminders`
- `saved_views`

If the application becomes multi-user, introduce an authenticated `users` table and ownership foreign keys through a dedicated migration rather than retrofitting ad hoc filters.
