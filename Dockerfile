# ── better-issues (Turbo + TanStack Start) ───────────────────
#
# Build args (both baked into JS):
#   NEXT_PUBLIC_CONVEX_URL       - Convex backend URL
#   NEXT_PUBLIC_CONVEX_SITE_URL  - Convex HTTP/site URL (for auth proxy; defaults to CONVEX_URL)
#
# Runtime env vars (for self-hosted Convex deploy on startup):
#   CONVEX_SELF_HOSTED_URL       - Convex backend URL (for CLI)
#   CONVEX_SELF_HOSTED_ADMIN_KEY - Admin key
#   BETTER_AUTH_SECRET           - Auth secret
#   SITE_URL                     - Public URL of this app
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g bun

COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/config/package.json packages/config/package.json

RUN bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_PUBLIC_CONVEX_SITE_URL=${NEXT_PUBLIC_CONVEX_SITE_URL}

RUN bun run build

# ── Production runner ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4100
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Convex CLI for deploying functions at startup
RUN npm install -g convex && \
    mkdir -p /convex-deploy && \
    cd /convex-deploy && \
    npm init -y > /dev/null 2>&1 && \
    npm install --save convex@1.31.2 better-auth@1.4.9 @convex-dev/better-auth@0.10.9 zod dotenv > /dev/null 2>&1

# TanStack Start output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

# Convex source for deployment
COPY --from=builder /app/packages/backend/convex /convex-deploy/convex
COPY --from=builder /app/packages/backend/package.json /convex-deploy/package.json

# Entrypoint
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R nextjs:nodejs /convex-deploy

USER nextjs
EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4100/api/health || exit 1

CMD ["/entrypoint.sh"]
