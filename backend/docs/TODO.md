# TODO

## Phase 1 — Backend foundation

- [x] Neon PostgreSQL connection
- [x] Drizzle schema and migrations
- [x] Owner-only authentication
- [x] Login throttling
- [x] Opportunities CRUD
- [x] Tasks CRUD
- [x] Search, filters, and pagination
- [x] Dashboard attention queries
- [x] Audit log
- [x] Health endpoint
- [x] Deployment documentation

## Phase 2 — First usable frontend

- [ ] Build owner login screen
- [ ] Build global application shell
- [ ] Build Home / Needs Attention dashboard
- [ ] Build Quick Add flow
- [ ] Build Opportunities list
- [ ] Build opportunity detail drawer/page
- [ ] Build status-change actions
- [ ] Build Tasks view
- [ ] Add one-click "Open application" behavior
- [ ] Add responsive mobile layout
- [ ] Add empty, loading, and error states

## Phase 3 — Workflow refinement

- [ ] Add saved filters/views
- [ ] Add calendar/timeline view
- [ ] Add tags only if real usage requires them
- [ ] Add duplicate URL detection
- [ ] Add soft-delete/archive policy if permanent deletion becomes risky
- [ ] Add bulk status updates if the list becomes large
- [ ] Add dashboard grouping by opportunity type
- [ ] Add "forgotten item" logic for old saved opportunities

## Phase 4 — Reminders

- [ ] Define reminder rules for deadline and follow-up dates
- [ ] Add reminder records or scheduled workflow
- [ ] Add email or push delivery only after the in-app workflow is stable

## Phase 5 — Optional intelligence

- [ ] Paste a URL and extract title, organization, and deadline
- [ ] Detect whether a URL is an information page or direct application link
- [ ] Suggest a next action
- [ ] Import an opportunity from email
- [ ] Add browser share/extension flow

## Engineering rules

- Keep route handlers thin.
- Keep database access in feature services.
- Add schema changes through migrations.
- Do not add Redis, queues, or additional services without a measured need.
- Avoid creating tables for hypothetical features.
- Keep external links as URLs, not copied web content.
- Add tests when workflow rules become more complex.
