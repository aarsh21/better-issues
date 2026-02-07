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
│   └── entrypoint.sh        # Docker entrypoint (deploy + start)
├── Dockerfile               # Frontend build + Convex deploy
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
```

This is printed during `dev:setup`. If you use Convex Cloud, the site URL is derived automatically.

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

The frontend is a single Dockerfile. Deploy Convex separately, then point this container at it.

### Architecture

```
┌──────────────────────────────────────────┐
│  Dokploy                                 │
│                                          │
│  Service 1: Convex Backend (separate)    │
│  ┌──────────┐    ┌────────────────────┐  │
│  │ postgres │◄───│ convex-backend     │  │
│  │ :5432    │    │ :3210 (API/WS)     │  │
│  └──────────┘    └────────────────────┘  │
│                                          │
│  Service 2: better-issues (this repo)    │
│  ┌────────────────────────────────────┐  │
│  │  Dockerfile                        │  │
│  │  1. Deploy Convex functions        │  │
│  │  2. Set auth env vars              │  │
│  │  3. Start Next.js on :3000         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Step 1: Deploy Convex backend separately

Create a Docker service in Dokploy using the official image:

```
ghcr.io/get-convex/convex-backend:latest
```

Set the required env vars for the Convex service:

```env
INSTANCE_NAME=better-issues
INSTANCE_SECRET=<openssl rand -hex 32>
POSTGRES_URL=postgresql://postgres:<password>@<postgres-host>:5432
```

Expose port **3210** to a domain (e.g. `convex.yourdomain.com`). Make sure WebSocket upgrade is allowed.

Generate the admin key on your server:

```bash
docker exec <convex-container> ./generate_admin_key.sh
```

Save this key -- you'll need it for the web service.

### Step 2: Create the web Application in Dokploy

1. Create a new project in Dokploy
2. Click **"+ Create Service"** and choose **"Application"**
3. Point to your Git repo, Dokploy will pick up the `Dockerfile`
4. Map port **3000** to your domain (e.g. `issues.yourdomain.com`)

### Step 3: Set build args

In the Dokploy **Environment** tab, set this **build argument** (baked into the JS bundle):

```env
NEXT_PUBLIC_CONVEX_URL=https://convex.yourdomain.com
```

### Step 4: Set runtime env vars

In the same **Environment** tab, add these **runtime env vars**:

```env
CONVEX_SELF_HOSTED_URL=https://convex.yourdomain.com
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin key from step 1>
BETTER_AUTH_SECRET=<openssl rand -hex 32>
SITE_URL=https://issues.yourdomain.com
```

### Step 5: Deploy

Click **Deploy**. On startup, the container will:

1. Deploy Convex functions to your self-hosted backend
2. Set `BETTER_AUTH_SECRET` and `SITE_URL` on the Convex backend
3. Start the Next.js server

### Verify

- Frontend: `https://issues.yourdomain.com`
- Health check: `https://issues.yourdomain.com/api/health`

### Subsequent Deploys

Push to your repo and click **Deploy**. The entrypoint re-deploys Convex functions automatically on every container start.

### Troubleshooting

| Issue                 | Fix                                                                |
| --------------------- | ------------------------------------------------------------------ |
| Convex deploy fails   | Check `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY`  |
| Auth errors           | Ensure `BETTER_AUTH_SECRET` and `SITE_URL` are set                 |
| Browser can't connect | Check `NEXT_PUBLIC_CONVEX_URL` matches your Convex backend domain  |
| WebSocket fails       | Ensure reverse proxy supports WebSocket upgrade headers            |

---

## License

Private.
