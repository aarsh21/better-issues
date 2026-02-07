#!/bin/sh
set -e

# ── Deploy Convex functions if self-hosted vars are set ────────
if [ -n "$CONVEX_SELF_HOSTED_URL" ] && [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
  echo "==> Deploying Convex functions to $CONVEX_SELF_HOSTED_URL ..."
  cd /convex-backend
  npx convex deploy 2>&1 || echo "!!! Convex deploy failed (backend may not be ready yet)"

  if [ -n "$BETTER_AUTH_SECRET" ]; then
    npx convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET" 2>&1 || true
    echo "    BETTER_AUTH_SECRET set"
  fi
  if [ -n "$SITE_URL" ]; then
    npx convex env set SITE_URL "$SITE_URL" 2>&1 || true
    echo "    SITE_URL set"
  fi
  echo "==> Convex deploy complete"
  cd /app
fi

# ── Start Next.js ──────────────────────────────────────────────
echo "==> Starting Next.js on port ${PORT:-3000}"
exec node apps/web/server.js
