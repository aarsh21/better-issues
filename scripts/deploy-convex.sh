#!/bin/sh
set -e

echo "==> Waiting for Convex backend to be healthy..."
until curl -sf http://convex:3210/version > /dev/null 2>&1; do
  echo "    Backend not ready, retrying in 3s..."
  sleep 3
done
echo "==> Backend is healthy."

cd packages/backend

echo "==> Deploying Convex functions..."
bunx convex deploy

echo "==> Setting environment variables..."
if [ -n "$BETTER_AUTH_SECRET" ]; then
  bunx convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET"
  echo "    BETTER_AUTH_SECRET set."
fi

if [ -n "$SITE_URL" ]; then
  bunx convex env set SITE_URL "$SITE_URL"
  echo "    SITE_URL set."
fi

echo "==> Deploy complete!"
