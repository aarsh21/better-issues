#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# ── Helpers ──────────────────────────────────────────────────────────────────
info()  { printf '\033[1;34m[info]\033[0m  %s\n' "$*"; }
ok()    { printf '\033[1;32m[ok]\033[0m    %s\n' "$*"; }
error() { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

# ── Prerequisites ────────────────────────────────────────────────────────────
command -v docker  >/dev/null || error "docker is not installed"
command -v bun     >/dev/null || error "bun is not installed"

# ── Create .env if missing ───────────────────────────────────────────────────
if [ ! -f .env ]; then
  info "Creating .env from .env.example ..."
  cp .env.example .env
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

# Auto-generate secrets if empty
if [ -z "${BETTER_AUTH_SECRET:-}" ]; then
  BETTER_AUTH_SECRET=$(openssl rand -base64 32)
  sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}|" .env
  info "Generated BETTER_AUTH_SECRET"
fi

if [ -z "${INSTANCE_SECRET:-}" ]; then
  INSTANCE_SECRET=$(openssl rand -hex 32)
  sed -i "s|^INSTANCE_SECRET=.*|INSTANCE_SECRET=${INSTANCE_SECRET}|" .env
  info "Generated INSTANCE_SECRET"
fi

export BETTER_AUTH_SECRET INSTANCE_SECRET

# ── Install deps (needed for convex CLI) ─────────────────────────────────────
if [ ! -d node_modules ]; then
  info "Installing dependencies ..."
  bun install
fi

# ── Start Convex backend ─────────────────────────────────────────────────────
info "Starting Convex backend ..."
docker compose up -d convex

info "Waiting for Convex backend to be healthy ..."
until curl -sf http://localhost:3210/version > /dev/null 2>&1; do
  sleep 1
done
ok "Convex backend is ready"

# ── Get admin key ────────────────────────────────────────────────────────────
ADMIN_KEY=$(docker compose exec -T convex ./generate_admin_key.sh 2>/dev/null | tr -d '[:space:]')
[ -n "$ADMIN_KEY" ] || error "Failed to generate admin key"
ok "Admin key generated"

export CONVEX_SELF_HOSTED_URL=http://localhost:3210
export CONVEX_SELF_HOSTED_ADMIN_KEY="$ADMIN_KEY"

# ── Deploy Convex functions ──────────────────────────────────────────────────
info "Deploying Convex functions ..."
bunx convex deploy --typecheck=disable

ok "Functions deployed"

# ── Set Convex environment variables ─────────────────────────────────────────
PUBLIC_SITE_URL="${PUBLIC_SITE_URL:-http://localhost:3000}"
PUBLIC_ALLOWED_SIGNUPS="${PUBLIC_ALLOWED_SIGNUPS:-true}"

declare -A CONVEX_VARS=(
  [SITE_URL]="$PUBLIC_SITE_URL"
  [BETTER_AUTH_URL]="$PUBLIC_SITE_URL"
  [BETTER_AUTH_SECRET]="$BETTER_AUTH_SECRET"
  [ALLOWED_SIGNUPS]="$PUBLIC_ALLOWED_SIGNUPS"
)

info "Setting Convex environment variables ..."
for key in "${!CONVEX_VARS[@]}"; do
  bunx convex env set "$key" "${CONVEX_VARS[$key]}" 2>/dev/null || true
done
ok "Convex env vars configured"

# ── Build and start everything ───────────────────────────────────────────────
info "Starting all services ..."
docker compose up -d --build

ok "All services running"
echo ""
echo "  App:       ${PUBLIC_SITE_URL}"
echo "  Convex:    http://localhost:3210"
echo "  Dashboard: http://localhost:6791"
echo ""
