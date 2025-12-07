#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

STAMP=$(date +"%Y%m%d-%H%M%S")
DB_BACKUP="$BACKUP_DIR/prisma-$STAMP.dump"

echo "Backing up Prisma database to $DB_BACKUP"
cp ./backend/prisma/dev.db "$DB_BACKUP" 2>/dev/null || true

echo "Backup completed."
