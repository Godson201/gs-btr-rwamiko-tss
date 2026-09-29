# Render test deployment

The root `render.yaml` Blueprint provisions the complete test environment:

- `gs-btr-rwamiko-web`: Next.js frontend
- `gs-btr-rwamiko-api`: NestJS backend
- `gs-btr-rwamiko-db`: PostgreSQL database

## Deploy

1. Sign in to Render with GitHub and authorize this repository.
2. Select **New > Blueprint**.
3. Choose `Godson201/gs-btr-rwamiko-tss` and the `main` branch.
4. Keep the Blueprint path as `render.yaml`.
5. Enter a private production administrator email and a new strong temporary password when prompted.
6. Apply the Blueprint and wait for all three resources to become available.

The backend automatically applies the Prisma schema and runs the idempotent seed before starting.

## Verify

- Frontend: `https://gs-btr-rwamiko-web.onrender.com`
- API health: `https://gs-btr-rwamiko-api.onrender.com/api/health`

The health response must report `database: connected`.

## Free-tier limitations

- Free web services sleep after 15 minutes without inbound requests and can take about one minute to wake.
- A free Render PostgreSQL database expires 30 days after creation.
- Free web-service filesystems are ephemeral. Uploaded documents and images can disappear after a restart or redeploy. Use external object storage or a paid persistent disk before accepting real records.
- Do not enter the local `ChangeMe123!` password. Use a new temporary password and change it after first login.
