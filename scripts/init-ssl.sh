#!/bin/bash
# First-time SSL certificate setup using certbot standalone mode.
# Run this ONCE on the VPS before starting the full stack.
#
# Usage: bash scripts/init-ssl.sh
# Requires: DOMAIN and CERTBOT_EMAIL set in .env at the repo root.

set -euo pipefail

# Load .env from repo root
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
else
  echo "ERROR: .env not found. Copy .env.example to .env and fill in DOMAIN and CERTBOT_EMAIL."
  exit 1
fi

DOMAIN="${DOMAIN:?DOMAIN is not set in .env}"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL is not set in .env}"
PROJECT="${COMPOSE_PROJECT_NAME:-$(basename "$PWD")}"
CERT_VOLUME="${PROJECT}_certbot-certs"

echo "→ Issuing Let's Encrypt certificate for $DOMAIN"
echo "  Volume: $CERT_VOLUME"
echo "  Email:  $EMAIL"
echo ""

# certbot standalone briefly listens on port 80 — make sure nginx is stopped
if docker compose ps nginx 2>/dev/null | grep -q "Up"; then
  echo "→ Stopping nginx for standalone challenge..."
  docker compose stop nginx
fi

docker run --rm \
  -p 80:80 \
  -v "${CERT_VOLUME}:/etc/letsencrypt" \
  certbot/certbot certonly \
  --standalone \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

echo ""
echo "✓ Certificate issued for $DOMAIN"
echo ""
echo "→ Starting all services..."
docker compose up -d

echo ""
echo "✓ Done! Your app is live at:"
echo "    https://$DOMAIN"
echo "    https://$DOMAIN/api"
echo ""
echo "BAS-IP device callback URL:"
echo "    https://$DOMAIN/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>"
