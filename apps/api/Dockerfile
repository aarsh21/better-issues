FROM oven/bun:1.3.7-alpine AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

RUN bun install --frozen-lockfile

COPY . .

RUN bun run --cwd apps/api build

FROM oven/bun:1.3.7-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3002

CMD ["bun", "dist/index.js"]
