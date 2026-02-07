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
├── convex/              # Convex backend (functions, schema)
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components + shadcn/ui
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities, auth, env
│   └── convex.ts        # Barrel re-export for convex types
├── public/              # Static assets
├── Dockerfile           # Production build
├── scripts/
│   └── entrypoint.sh    # Docker entrypoint
└── next.config.ts       # Next.js config
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

```bash
bun run dev:setup
```

### 3. Set environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=<your convex URL>
```

Set Convex environment variables:

```bash
npx convex env set BETTER_AUTH_SECRET $(openssl rand -hex 32)
npx convex env set SITE_URL http://localhost:3001
```

### 4. Start dev servers

```bash
# Terminal 1: Convex backend
bun run dev:server

# Terminal 2: Next.js frontend
bun run dev
```

The app runs at [http://localhost:3001](http://localhost:3001).

### Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `bun run dev`        | Start Next.js dev server       |
| `bun run dev:server` | Start Convex dev server        |
| `bun run dev:setup`  | One-time Convex configuration  |
| `bun run build`      | Production build               |
| `bun run check`      | Lint + format (oxlint + oxfmt) |
| `bun run check-types`| TypeScript type checking       |

---

## Deploy on Dokploy (Self-Hosted)

### Step 1: Deploy Convex backend separately

Use `ghcr.io/get-convex/convex-backend:latest` as a Docker service in Dokploy. Generate the admin key with `./generate_admin_key.sh`.

### Step 2: Create web Application

Point Dokploy at this repo. Set build arg:

```env
NEXT_PUBLIC_CONVEX_URL=https://convex.yourdomain.com
```

Set runtime env vars:

```env
CONVEX_SELF_HOSTED_URL=https://convex.yourdomain.com
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin key>
BETTER_AUTH_SECRET=<openssl rand -hex 32>
SITE_URL=https://issues.yourdomain.com
```

### Step 3: Deploy

On startup, the container deploys Convex functions, sets auth env vars, then starts Next.js.

---

## License

Private.
