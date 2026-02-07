# better-issues

A fast, focused issue tracker for small teams. Type-safe templates, real-time updates, role-based access, and a UI that gets out of your way.

## Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS v4, shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Better Auth with organization plugin (teams, roles, invitations)
- **Language**: TypeScript (strict)

## Project Structure

```
better-issues/
├── apps/
│   └── web/                 # Next.js frontend
├── packages/
│   ├── backend/             # Convex backend (functions, schema)
│   │   └── convex/
│   ├── config/              # Shared TypeScript config
│   └── env/                 # Environment variable validation
├── scripts/
│   └── deploy-convex.sh     # Docker deploy helper
├── Dockerfile               # Next.js production build
├── Dockerfile.deploy        # Convex function deploy (one-shot)
├── docker-compose.yml       # Full stack: Convex + Postgres + Web
└── .env.example             # Environment template
```

## Local Development

### Prerequisites

- [Bun](https://bun.sh) v1.3+
- Node.js 20+ (for Convex CLI)

### 1. Install dependencies

```bash
bun install
```

### 2. Set up Convex

Run the Convex setup wizard to configure your development instance:

```bash
bun run dev:setup
```

This connects to Convex Cloud (free tier) and generates the necessary config files.

### 3. Set environment variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=<your convex cloud URL>
NEXT_PUBLIC_CONVEX_SITE_URL=<your convex site URL>
```

These are printed during `dev:setup`.

Set Convex environment variables for auth:

```bash
cd packages/backend
bunx convex env set BETTER_AUTH_SECRET $(openssl rand -hex 32)
bunx convex env set SITE_URL http://localhost:3001
```

### 4. Start dev servers

In two terminals:

```bash
# Terminal 1: Convex backend (syncs functions in real-time)
bun run dev:server

# Terminal 2: Next.js frontend
bun run dev:web
```

The web app runs at [http://localhost:3001](http://localhost:3001).

### Available Scripts

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `bun install`         | Install all dependencies       |
| `bun run dev:setup`   | One-time Convex configuration  |
| `bun run dev:server`  | Start Convex dev server        |
| `bun run dev:web`     | Start Next.js dev server       |
| `bun run check`       | Lint + format (oxlint + oxfmt) |
| `bun run check-types` | TypeScript type checking       |
| `bun run build`       | Build all packages             |

---

## Deploy on Dokploy (Self-Hosted)

One `docker compose up --build -d` starts the full stack: Convex backend, PostgreSQL, Convex dashboard, and Next.js frontend. The admin key is auto-generated -- no manual steps beyond setting three secrets.

### Prerequisites

- A VPS with 2+ GB RAM (4 GB recommended)
- [Dokploy](https://dokploy.com) installed on the VPS
- A domain name with DNS configured

### Architecture

```
┌─────────────────────────────────────────────┐
│ Docker Compose                              │
│                                             │
│  ┌──────────┐    ┌───────────────────────┐  │
│  │ postgres │◄───│  convex (backend)     │  │
│  │ :5432    │    │  :3210 (API/WS)       │  │
│  └──────────┘    │  :3211 (HTTP actions) │  │
│                  └───────────┬───────────┘  │
│                              │              │
│  ┌──────────────┐   ┌───────┴──────────┐   │
│  │ dashboard    │   │ convex-deploy    │   │
│  │ :6791        │   │ (one-shot)       │   │
│  └──────────────┘   └───────┬──────────┘   │
│                              │              │
│                     ┌───────┴──────────┐   │
│                     │  web (Next.js)   │   │
│                     │  :3000           │   │
│                     └──────────────────┘   │
└─────────────────────────────────────────────┘
```

### Step 1: Create a Compose project in Dokploy

> **Important**: You must create a **Compose** project, not an Application.
> An Application only builds a single Dockerfile. Compose runs all 5 services.

1. Log into Dokploy
2. Create a new project (e.g. "better-issues")
3. Click **"+ Create Service"** and choose **"Compose"**
4. Under **Provider**, select your Git source and point to the repo
5. Set **Compose Path** to `docker-compose.yml` (default)

### Step 2: Generate secrets

Run these locally or on your server:

```bash
openssl rand -hex 32   # → INSTANCE_SECRET
openssl rand -hex 16   # → DB_PASSWORD
openssl rand -hex 32   # → BETTER_AUTH_SECRET
```

### Step 3: Set environment variables in Dokploy

Go to the **Environment** tab in Dokploy and add:

```env
# Secrets
INSTANCE_SECRET=<generated>
DB_PASSWORD=<generated>
BETTER_AUTH_SECRET=<generated>

# Public URLs (what the browser sees — use YOUR domains)
CONVEX_CLOUD_ORIGIN=https://convex.yourdomain.com
CONVEX_SITE_ORIGIN=https://convex-site.yourdomain.com
SITE_URL=https://issues.yourdomain.com
```

The Convex admin key is **auto-derived** from `INSTANCE_SECRET` -- you do not need to set it manually.

### Step 4: Configure domains in Dokploy

In the **Domains** tab, add:

| Service     | Domain                       | Internal Port |
| ----------- | ---------------------------- | ------------- |
| `convex`    | `convex.yourdomain.com`      | 3210          |
| `convex`    | `convex-site.yourdomain.com` | 3211          |
| `web`       | `issues.yourdomain.com`      | 3000          |
| `dashboard` | `dashboard.yourdomain.com`   | 6791          |

Dokploy handles SSL via Traefik automatically.

**Important for Convex**: Ensure WebSocket upgrade is allowed on `convex.yourdomain.com`. In Dokploy's domain settings for the convex service, verify the proxy supports `Upgrade: websocket` headers.

### Step 5: Deploy

Click **Deploy** in Dokploy. That's it.

This will:

1. Start PostgreSQL and wait for it to be healthy
2. Start the Convex backend (connects to Postgres)
3. Start the Convex dashboard
4. Build and run `convex-deploy` which auto-generates the admin key, pushes functions, and sets auth env vars
5. Build and start the Next.js frontend

### Step 6: Verify

- Frontend: `https://issues.yourdomain.com`
- Dashboard: `https://dashboard.yourdomain.com`
- Health check: `https://issues.yourdomain.com/api/health`

### Subsequent Deploys

Push to your repo and click **Deploy** (or enable Autodeploy). The `convex-deploy` service re-runs automatically to push any function changes.

### Backup

```bash
docker compose exec postgres pg_dump -U postgres convex_self_hosted > backup.sql
```

### Troubleshooting

| Issue                 | Fix                                                             |
| --------------------- | --------------------------------------------------------------- |
| Backend won't start   | Check `INSTANCE_SECRET` is set and `postgres` is healthy        |
| Deploy fails          | Check `convex-deploy` logs: `docker compose logs convex-deploy` |
| Auth errors           | Ensure `BETTER_AUTH_SECRET` and `SITE_URL` are set              |
| Browser can't connect | Check `CONVEX_CLOUD_ORIGIN` matches external URL                |
| WebSocket fails       | Ensure reverse proxy supports WebSocket upgrade                 |

---

## License

Private.
