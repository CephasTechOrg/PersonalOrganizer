# Query Examples

These examples show the core product behavior directly in PostgreSQL.

## Everything still needing an application

```sql
SELECT *
FROM opportunities
WHERE status IN ('saved', 'need_to_apply', 'in_progress')
ORDER BY deadline_at ASC NULLS LAST, created_at DESC;
```

## Opportunities due within two days

```sql
SELECT *
FROM opportunities
WHERE status IN ('saved', 'need_to_apply', 'in_progress')
  AND deadline_at >= NOW()
  AND deadline_at <= NOW() + INTERVAL '2 days'
ORDER BY deadline_at ASC;
```

## Overdue opportunities

```sql
SELECT *
FROM opportunities
WHERE status IN ('saved', 'need_to_apply', 'in_progress')
  AND deadline_at < NOW()
ORDER BY deadline_at ASC;
```

## Applications waiting for follow-up

```sql
SELECT *
FROM opportunities
WHERE status IN ('applied', 'waiting')
  AND follow_up_at IS NOT NULL
  AND follow_up_at <= NOW()
ORDER BY follow_up_at ASC;
```

## Open tasks attached to one opportunity

```sql
SELECT *
FROM tasks
WHERE opportunity_id = 'OPPORTUNITY_UUID'
  AND status IN ('todo', 'in_progress')
ORDER BY due_at ASC NULLS LAST, created_at ASC;
```

## Application pipeline counts

```sql
SELECT status, COUNT(*)
FROM opportunities
GROUP BY status
ORDER BY status;
```
