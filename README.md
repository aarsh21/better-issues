# better-issues

`better-issues` is a premium issue tracker built as a Bun-powered Turbo monorepo.
It has a TanStack Start frontend, an Elysia API, Better Auth for authentication and organizations,
Drizzle + SQLite for persistence, and UploadThing for file uploads.

## What This Repo Contains

- `apps/web` - the main product UI built with TanStack Start
- `apps/api` - the Elysia backend that serves auth, issue, label, template, and attachment APIs
- `packages/api-client` - shared API client helpers and DTO/contracts used by the web app
- `packages/auth` - Better Auth configuration and permission helpers
- `packages/db` - Drizzle schema, migrations, SQLite client, and seed scripts
- `packages/env` - shared environment parsing and validation
- `packages/config` - shared TypeScript config

## Where To Find Code

### Frontend

- `apps/web/src/app` - route modules for pages and route handlers
- `apps/web/src/components` - reusable UI components
- `apps/web/src/hooks` - React hooks
- `apps/web/src/lib` - utilities, navigation helpers, API helpers, and app-specific client code
- `apps/web/public` - static assets
- `apps/web/vite.config.ts` - Vite and TanStack Start configuration

Do not edit `apps/web/src/routeTree.gen.ts` manually. It is generated.

### Backend

- `apps/api/src/app.ts` - main Elysia app and route definitions
- `apps/api/src/index.ts` - API server entrypoint
- `apps/api/src/uploadthing.ts` - UploadThing routes and file handling
- `apps/api/src/errors.ts` - backend error helpers

### Database and Auth

- `packages/db/src/schema.ts` - database schema
- `packages/db/src/index.ts` - SQLite client setup
- `packages/db/src/migrate.ts` - migration runner
- `packages/db/src/seed.ts` - seed script
- `packages/db/migrations` - generated Drizzle migrations
- `packages/auth/src/index.ts` - Better Auth setup and permission logic

### Shared Contracts and Env

- `packages/api-client/src/contracts.ts` - shared DTOs, template schema validation, and contract types
- `packages/api-client/src/index.ts` - API client helpers and query options
- `packages/env/src/api.ts` - API env validation
- `packages/env/src/web.ts` - web env validation

## Stack

- Bun
- Turbo
- TanStack Start
- TanStack Router
- TanStack Query
- Elysia
- Better Auth
- Drizzle ORM
- SQLite
- UploadThing
- Tailwind CSS + shadcn/ui

## Local Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Create local env files

The frontend, API, and database tooling do not all read from the same env file.
For local development, create these files:

- `apps/web/.env.local`
- `apps/api/.env.local`
- `packages/db/.env.local`

You can copy the web example file as a starting point:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Use the following values for local development.

`apps/web/.env.local`

```env
API_URL=http://localhost:3002
VITE_API_URL=http://localhost:3002
ALLOWED_SIGNUPS=true
VITE_ALLOWED_SIGNUPS=true
```

`apps/api/.env.local`

```env
APP_URL=http://localhost:3001
API_URL=http://localhost:3002
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
ALLOWED_SIGNUPS=true
DATABASE_URL=file:../../data/better-issues.sqlite
UPLOADTHING_TOKEN=replace-with-your-uploadthing-token
```

`packages/db/.env.local`

```env
APP_URL=http://localhost:3001
API_URL=http://localhost:3002
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
ALLOWED_SIGNUPS=true
DATABASE_URL=file:../../data/better-issues.sqlite
UPLOADTHING_TOKEN=replace-with-your-uploadthing-token
```

Required notes:

- `BETTER_AUTH_SECRET` should be a long random string, at least 32 characters.
- `UPLOADTHING_TOKEN` is required for upload flows.
- If you only want the app to boot and do not need uploads yet, any non-empty placeholder token will let the API start, but uploads will fail until you set a real token.

### 3. Generate and apply the database schema

```bash
bun run db:generate
bun run db:migrate
```

### 4. Optionally seed the database

```bash
bun run db:seed
```

### 5. Run the app locally

Start the frontend and API in separate terminals:

```bash
bun run dev:web
```

```bash
bun run dev:api
```

Default local URLs:

- Web: `http://localhost:3001`
- API: `http://localhost:3002`

## Useful Commands

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
- `docker-compose.yml` for running both services with a persisted SQLite volume

Start both services with:

```bash
docker compose up --build
```
