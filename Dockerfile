# ── better-issues: Next.js Frontend ────────────────────────────
#
# Stage 1 (deps):    Bun installs from bun.lock
# Stage 2 (builder): Node.js builds the Next.js app
# Stage 3 (runner):  Minimal Node.js production server
# ───────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies with Bun ─────────────────────
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN bun install --frozen-lockfile

# ── Stage 2: Build with Node.js ───────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL}

RUN cd apps/web && npx next build

# ── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
