#!/bin/sh
set -e

# ── Deploy Convex functions if self-hosted vars are set ────────
if [ -n "$CONVEX_SELF_HOSTED_URL" ] && [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
  echo "==> Waiting for Convex backend at $CONVEX_SELF_HOSTED_URL ..."
  attempts=0
  max_attempts="${CONVEX_DEPLOY_MAX_ATTEMPTS:-60}"
  while ! wget -q --spider "$CONVEX_SELF_HOSTED_URL/version"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge "$max_attempts" ]; then
      echo "!!! Convex backend not ready after ${max_attempts} attempts"
      break
    fi
    sleep 2
  done

  echo "==> Deploying Convex functions to $CONVEX_SELF_HOSTED_URL ..."
  cd /convex-deploy

  convex deploy \
    -y \
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
else
  echo "!!! Skipping Convex deploy. Set CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY."
fi

# ── Start TanStack Start server ───────────────────────────────
echo "==> Starting TanStack Start on port ${PORT:-4100}"
exec node /app/scripts/start-web.mjs
