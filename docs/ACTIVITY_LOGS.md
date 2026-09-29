# Admin activity logs

Open **Admin > Settings > Activity logs** for the full, paginated history with
user/action search, HTTP action, result and date filters. The previous activity-log
URL redirects to this section in Settings.
Only accounts with ADMIN or SUPER_ADMIN portal access can read the API. There are
no application endpoints to edit or delete audit entries.

## Recorded activity

- Authenticated API reads and writes, including viewing the audit history.
- Public submissions, sign-in attempts and password-reset requests.
- Failed requests to matched API routes, including authentication, authorization
  and validation failures.
- Logout when the frontend can reach the backend.

Entries include time, verified actor identity when available, HTTP method and route
template, affected record ID when available, response status, network peer address
and browser/client header. Actor identity is preserved if the user is later deleted.
An unsuccessful sign-in has an unknown actor; a supplied login name is not treated
as verified identity. Network addresses can identify the frontend proxy, rather
than the user's phone or computer. Browser headers are client-supplied metadata.

Request and response bodies, query strings, passwords, tokens, cookies, uploaded
files and message contents are not recorded. Public successful reads, health
checks, OPTIONS and HEAD requests are excluded. This is request activity history,
not before/after record versions, infrastructure logs or email delivery tracking.
Background jobs, seed scripts and direct database changes are outside its scope.

Recording begins after deployment; earlier activity cannot be reconstructed.
Records are written after the HTTP response completes. If persistence fails, the
backend emits an error without changing an already completed operation's response.
An outage or process termination can therefore leave a gap in the history.

## Deployment and verification

The Prisma schema extends the existing `AuditLog` table with nullable metadata,
an optional user relationship with `ON DELETE SET NULL`, and query indexes.
The existing Render startup command (`prisma db push`) applies these changes.
Generate Prisma Client and apply the schema before starting this backend elsewhere.
Existing audit records remain readable; missing historical metadata is displayed
as “Not recorded”.

Run `npm run test:audit` in `backend` for HTTP integration checks. These use isolated
in-memory persistence and exercise the real routing, guards, validation and audit
capture without contacting the school database.

After deployment, sign in as an admin, perform a normal update and check its entry
under **Settings > Activity logs**. Confirm teacher and parent accounts cannot access
`GET /api/audit-logs`. Filters use local-day boundaries, and pagination keeps a
time snapshot until Refresh or Apply filters is used.
