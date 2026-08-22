# Frontend Integration

The intended frontend is React inside the same Next.js project.

## Fetch helper

A small frontend API helper is enough:

```ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}
```

## Recommended screens

### Home

Use `GET /api/dashboard` to render:

- Needs Attention
- Follow-ups due
- Upcoming tasks
- status counts

### Opportunities

Use `GET /api/opportunities` and keep filtering server-side.

Important saved views:

- Need to Apply
- In Progress
- Applied / Waiting
- Interviews
- Accepted
- Rejected
- Archived

### Quick Add

Keep this intentionally fast. The minimum payload is only:

```json
{ "title": "Program name" }
```

The user can enrich the record later.

### Opening links

Prefer `applicationUrl` when the user clicks "Apply". Fall back to `sourceUrl` when no direct application link exists.

Open external links in a new tab with `rel="noopener noreferrer"`.

### Tasks

A task can exist on its own or under an opportunity. Use `kind` to choose an action label such as Apply, Download, Review, Contact, Attend, or Complete. If `actionUrl` is present, the UI can open it directly. The opportunity detail page should show linked tasks with one-click completion.

## UX principle

The frontend should optimize for action, not data entry. The most important information is:

1. What is due?
2. What has not been applied to?
3. What action is next?
4. What link should open?
5. What is waiting for a follow-up?
