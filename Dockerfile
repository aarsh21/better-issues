# ── better-issues Dockerfile ───────────────────────────────────
# Builds and runs the Next.js frontend.
# Convex backend runs as a cloud service -- NOT in this container.
#
# Build:
#   docker build \
#     --build-arg NEXT_PUBLIC_CONVEX_URL=https://your-instance.convex.cloud \
#     --build-arg NEXT_PUBLIC_CONVEX_SITE_URL=https://your-instance.convex.site \
#     -t better-issues .
#
# Run:
#   docker run -p 3000:3000 better-issues
#
# Or use docker compose:
#   docker compose up --build
# ───────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ──────────────────────────────
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

# Copy workspace root manifests
COPY package.json bun.lock ./

# Copy all workspace package.json files so Bun resolves workspaces
COPY apps/web/package.json ./apps/web/package.json
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN bun install --frozen-lockfile

# ── Stage 2: Build the Next.js app ────────────────────────────
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source code
COPY . .

# Convex URLs are baked into the client bundle at build time.
# Pass via --build-arg or .env file.
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL}

# Build only the web app (output: "standalone" is set in next.config.ts)
RUN cd apps/web && bun run build

# ── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server (includes tree-shaken node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets (not included in standalone output)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public directory if it exists
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Standalone server.js lives at the monorepo-relative path
CMD ["node", "apps/web/server.js"]
