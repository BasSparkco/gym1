#!/usr/bin/env bash
# Nightly production backup: Postgres dump + MinIO (member photos) archive.
# Installed in root's crontab; writes to backups/auto/ with 14-day rotation.
set -euo pipefail

BACKUP_DIR="/opt/sites/gym/backups/auto"
RETENTION_DAYS=14
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

# Postgres: plain-format dump of the live gym database, gzipped.
docker exec gym-db-1 pg_dump -U gym -d gym \
  | gzip > "$BACKUP_DIR/gym_db_${STAMP}.sql.gz"

# MinIO: tar the data volume (member photos). Read-only mount, no downtime.
docker run --rm \
  -v gym_minio-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/gym_minio_${STAMP}.tar.gz" -C /data .

# Rotate: drop anything older than RETENTION_DAYS.
find "$BACKUP_DIR" -name 'gym_*' -mtime +"$RETENTION_DAYS" -delete

echo "$(date -Is) backup ok: gym_db_${STAMP}.sql.gz + gym_minio_${STAMP}.tar.gz"
