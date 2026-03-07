# better-issues

`better-issues` is a Turbo monorepo with:

- `apps/web`: TanStack Start frontend
- `apps/api`: Elysia API server
- `packages/db`: Drizzle schema, SQLite client, migrations, seeds
- `packages/auth`: Better Auth config and org permissions
- `packages/api-client`: Eden client and shared DTO/query contracts
- `packages/env`: shared environment validation

## Stack

- Better Auth
- Elysia + Eden Treaty
- TanStack Query
- Drizzle ORM
- SQLite
- UploadThing

## Local setup

1. Install dependencies:

```bash
bun install
```

2. Copy the example env file and set your secrets:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required values:

- `BETTER_AUTH_SECRET`
- `UPLOADTHING_TOKEN`

3. Generate and apply the database schema:

```bash
bun run db:generate
bun run db:migrate
```

4. Optionally seed the database:

```bash
bun run db:seed
```

5. Run the web app and API in separate terminals:

```bash
bun run dev:web
bun run dev:api
```

The default local ports are:

- Web: [http://localhost:3001](http://localhost:3001)
- API: [http://localhost:3002](http://localhost:3002)

## Scripts

```bash
bun run dev:web
bun run dev:api
bun run check
bun run check-types
bun run build
bun run db:generate
bun run db:migrate
bun run db:studio
bun run db:seed
```

## Docker

The repo includes:

- `Dockerfile` for the web app
- `apps/api/Dockerfile` for the API server
- `docker-compose.yml` for running web + api + SQLite volume together

Start both services with:

```bash
docker compose up --build
```
