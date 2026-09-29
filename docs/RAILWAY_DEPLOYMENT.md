# Railway test deployment

Deploy this monorepo as three Railway services in one project.

## 1. PostgreSQL

Add a Railway PostgreSQL service. Railway supplies `DATABASE_URL`; do not copy the local database password into Railway.

## 2. Backend service

Create a service from this GitHub repository and set its root directory to `/backend`.

Required variables:

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `JWT_SECRET=<a new random production secret>`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=https://<frontend-domain>`
- `FRONTEND_URL=https://<frontend-domain>`
- `BCRYPT_SALT_ROUNDS=10`
- `THROTTLE_TTL=60`
- `THROTTLE_LIMIT=100`
- `SEED_ADMIN_EMAIL=<private administrator email>`
- `SEED_ADMIN_PASSWORD=<new strong temporary password>`

Generate a public domain for the backend after its first deployment.

## 3. Frontend service

Create another service from the repository and set its root directory to `/frontend`.

Required variables:

- `API_URL=https://<backend-domain>/api`
- `JWT_SECRET=<the exact same random secret used by the backend>`

Generate a public frontend domain, update `CORS_ORIGIN` and `FRONTEND_URL` on the backend, and redeploy the backend.

## 4. Seed test data

Run `npm run seed` once from the backend service shell. Change the temporary administrator password immediately after the first login.

## Important test-hosting notes

- Never publish `backend/.env` or `frontend/.env.local`.
- Uploaded media needs a Railway volume mounted at `/app/uploads` to survive redeployments.
- Use test data only until backups, monitoring, email delivery, and a custom domain are configured.
