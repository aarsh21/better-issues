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

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4100
ENV HOSTNAME="0.0.0.0"

ARG CONVEX_CLI_VERSION=latest

RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Convex CLI + Convex function deps for startup deploys.
RUN npm install -g convex@${CONVEX_CLI_VERSION} && \
    mkdir -p /convex-deploy && \
    cd /convex-deploy && \
    npm init -y > /dev/null 2>&1 && \
    npm install --save \
      convex@${CONVEX_CLI_VERSION} \
      better-auth@1.4.9 \
      @convex-dev/better-auth@0.10.9 \
      zod@4.1.13 \
      dotenv@17.2.2 > /dev/null 2>&1

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/dist ./apps/web/dist
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

COPY --from=builder /app/packages/backend/convex /convex-deploy/convex

COPY scripts/entrypoint.sh /entrypoint.sh
COPY scripts/start-web.mjs /app/scripts/start-web.mjs
RUN chmod +x /entrypoint.sh && \
    chown -R nextjs:nodejs /convex-deploy /app/scripts

USER nextjs
EXPOSE 4100

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4100/api/health || exit 1

CMD ["/entrypoint.sh"]
