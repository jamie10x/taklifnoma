#!/usr/bin/env bash

set -euo pipefail

APP_NAME="${APP_NAME:-taklifnoma}"
APP_DIR="${APP_DIR:-/var/www/taklifnoma}"
BRANCH="${BRANCH:-main}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' is not installed." >&2
    exit 1
  fi
}

require_command git
require_command bun
require_command pm2

if [ ! -d "$APP_DIR" ]; then
  echo "Error: APP_DIR does not exist: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

echo "[1/6] Fetching latest code from branch '$BRANCH'..."
git fetch --all --prune

echo "[2/6] Checking out branch '$BRANCH'..."
git checkout "$BRANCH"

echo "[3/6] Pulling latest commits..."
git pull --ff-only origin "$BRANCH"

echo "[4/6] Installing dependencies..."
if [ -f bun.lockb ] || [ -f bun.lock ]; then
  bun install --frozen-lockfile
else
  bun install
fi

echo "[5/6] Building application..."
bun run build

echo "[6/6] Reloading PM2 process..."
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save

echo "Deployment completed successfully for '$APP_NAME'."

