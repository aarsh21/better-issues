#!/bin/sh
set -e

echo "Reading admin key..."
ADMIN_KEY=$(cat /admin/key | tr -d '[:space:]')
[ -n "$ADMIN_KEY" ] || { echo "ERROR: admin key is empty"; exit 1; }

export CONVEX_SELF_HOSTED_ADMIN_KEY="$ADMIN_KEY"

echo "Deploying Convex functions to $CONVEX_SELF_HOSTED_URL ..."
bunx convex deploy --typecheck=disable

echo "Setting Convex environment variables..."
bunx convex env set SITE_URL "$SITE_URL"
bunx convex env set BETTER_AUTH_URL "$BETTER_AUTH_URL"
bunx convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET"
bunx convex env set ALLOWED_SIGNUPS "$ALLOWED_SIGNUPS"

echo "Convex setup complete."
