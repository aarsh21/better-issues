#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# ── Helpers ──────────────────────────────────────────────────────────────────
info()  { printf '\033[1;34m[info]\033[0m  %s\n' "$*"; }
ok()    { printf '\033[1;32m[ok]\033[0m    %s\n' "$*"; }
error() { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || error "docker is not installed"

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

# ── Start everything ─────────────────────────────────────────────────────────
info "Building and starting all services ..."
docker compose up --build -d

ok "All services starting"
echo ""
echo "  App:       ${PUBLIC_SITE_URL:-http://localhost:3000}"
echo "  Convex:    ${PUBLIC_CONVEX_URL:-http://localhost:3210}"
echo "  Dashboard: http://localhost:6791"
echo ""
echo "  Logs: docker compose logs -f"
echo ""
