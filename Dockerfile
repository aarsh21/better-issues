# ── better-issues: Frontend + Convex Deploy ────────────────────
#
# Build args (baked into client JS at build time):
#   NEXT_PUBLIC_CONVEX_URL  - Convex backend URL (browser connects here)
#
# Runtime env vars (for self-hosted Convex deploy on startup):
#   CONVEX_SELF_HOSTED_URL       - Convex backend URL (for CLI deploy)
#   CONVEX_SELF_HOSTED_ADMIN_KEY - Admin key from generate_admin_key.sh
#   BETTER_AUTH_SECRET           - Auth secret
#   SITE_URL                     - Public URL of this web app
# ───────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/env/package.json ./packages/env/package.json
COPY packages/config/package.json ./packages/config/package.json

RUN bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}

RUN cd apps/web && bun run build

# ── Production runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Convex CLI for deploying functions at startup
RUN npm install -g convex

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Convex backend source (functions + schema)
COPY --from=builder /app/packages/backend/convex /convex-backend/convex

# Entrypoint: deploy convex functions (if configured), then start Next.js
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://localhost:8080/api/health || exit 1

CMD ["/entrypoint.sh"]
