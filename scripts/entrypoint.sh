#!/bin/sh
set -e

# ── Deploy Convex functions if self-hosted vars are set ────────
if [ -n "$CONVEX_SELF_HOSTED_URL" ] && [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
  echo "==> Deploying Convex functions to $CONVEX_SELF_HOSTED_URL ..."
  cd /convex-backend

  convex deploy \
    --url "$CONVEX_SELF_HOSTED_URL" \
    --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY" \
    2>&1 || echo "!!! Convex deploy failed (backend may not be ready yet)"

  if [ -n "$BETTER_AUTH_SECRET" ]; then
    convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET" \
      --url "$CONVEX_SELF_HOSTED_URL" \
      --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY" \
      2>&1 || true
    echo "    BETTER_AUTH_SECRET set"
  fi
  if [ -n "$SITE_URL" ]; then
    convex env set SITE_URL "$SITE_URL" \
      --url "$CONVEX_SELF_HOSTED_URL" \
      --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY" \
      2>&1 || true
    echo "    SITE_URL set"
  fi

  echo "==> Convex deploy complete"
  cd /app
fi

# ── Start Next.js ──────────────────────────────────────────────
echo "==> Starting Next.js on port ${PORT:-8080}"
exec node apps/web/server.js
