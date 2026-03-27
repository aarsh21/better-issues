FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── Deploy stage: has convex CLI + source for pushing functions ──────────────
FROM oven/bun:1 AS deploy
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json convex.json tsconfig.json ./
COPY src/ ./src/
COPY scripts/deploy-convex.sh ./scripts/deploy-convex.sh
RUN chmod +x ./scripts/deploy-convex.sh
CMD ["sh", "./scripts/deploy-convex.sh"]

# ── Build stage: produces SvelteKit production build ─────────────────────────
FROM oven/bun:1 AS build
WORKDIR /app
ARG PUBLIC_CONVEX_URL=http://localhost:3210
ARG PUBLIC_CONVEX_SITE_URL=http://localhost:3211
ARG PUBLIC_SITE_URL=http://localhost:3000
ARG PUBLIC_ALLOWED_SIGNUPS=true
ENV PUBLIC_CONVEX_URL=$PUBLIC_CONVEX_URL
ENV PUBLIC_CONVEX_SITE_URL=$PUBLIC_CONVEX_SITE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_ALLOWED_SIGNUPS=$PUBLIC_ALLOWED_SIGNUPS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ── Runtime stage: slim Node.js image serving the built app ──────────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/build ./build
COPY --from=build /app/package.json .
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "build"]
