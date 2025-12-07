#!/usr/bin/env bash
set -euo pipefail

echo "Pulling latest changes..."
git pull

echo "Applying migrations..."
cd "$(dirname "$0")/../backend"
npm install
npx prisma migrate deploy

echo "Update completed."
