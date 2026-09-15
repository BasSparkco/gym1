#!/usr/bin/env bash
# One-shot: fires the Platinum RSA migration-announcement WhatsApp broadcast
# at 07:00 Israel time (06:00 CEST) on 2026-09-12. Installed as a single-day
# crontab entry (see send-migration-announcement.ts's own header for what
# it sends) — removes its own crontab line on exit so it never fires again.
set -uo pipefail

LOG="/opt/sites/gym/backups/migration-announcement-$(date +%Y%m%d_%H%M%S).log"

{
  echo "=== Starting migration announcement send at $(date) ==="
  docker exec gym-api-1 node dist/scripts/send-migration-announcement.js send
  echo "=== Finished at $(date) ==="
} > "$LOG" 2>&1

# Self-remove: strip the line that runs this script from root's crontab.
crontab -l 2>/dev/null | grep -v "send-migration-announcement-7am.sh" | crontab -
