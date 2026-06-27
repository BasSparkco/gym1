# Deployment Guide — Spark Gym ERP (VPS + Docker)

## Architecture

```
Internet → Nginx (80/443, SSL) → api:3002  (NestJS)
                               → web:3001  (Next.js)
```

- Single domain, path-based routing: `https://domain.com` → web, `https://domain.com/api` → API.
- Persistent data (`/app/.local`) is stored in a Docker volume (`api-data`).
- SSL certificates are managed by Certbot / Let's Encrypt.

---

## Prerequisites

On your VPS (Ubuntu 22.04 / 24.04 recommended):

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin -y

# Verify
docker compose version
```

Point your domain's **A record** to the VPS IP before proceeding.

---

## First-time deployment

### 1. Upload the repo to the VPS

```bash
# On your local machine — push the repo, then on the VPS:
git clone <your-repo-url> gym
cd gym
```

Or use `scp` / `rsync` if the repo is private and not on a remote.

### 2. Create the root `.env`

```bash
cp .env.example .env
nano .env
```

Fill in:
```
DOMAIN=gym.example.com
CERTBOT_EMAIL=you@example.com
```

### 3. Create the API `.env`

```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```

Fill in:
```
SPARKCO_API_KEY=your-real-key
DEVICE_TOKEN=<output of: openssl rand -hex 32>
```

Generate the device token:
```bash
openssl rand -hex 32
```

### 4. Build Docker images

```bash
docker compose build
```

This compiles both apps inside Docker — takes ~3–5 minutes on first run.

### 5. Get the SSL certificate and start everything

```bash
bash scripts/init-ssl.sh
```

This script:
1. Runs Certbot standalone on port 80 to issue the Let's Encrypt cert.
2. Starts all services (`api`, `web`, `nginx`, `certbot`).

Your app will be live at `https://your-domain`.

---

## Migrate existing live data

If you have live data in `apps/api/.local/` (from local development), copy it
into the Docker volume before starting:

```bash
# After building but before `docker compose up -d`:
docker volume create gym_api-data
docker run --rm \
  -v "$(pwd)/apps/api/.local:/src" \
  -v "gym_api-data:/dest" \
  alpine sh -c "cp -r /src/. /dest/"
```

---

## BAS-IP device configuration

After deployment, configure the AV-03BD:

**Settings → Access → Remote Access Server → Custom server**

```
https://<DOMAIN>/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>
```

- `DOMAIN` — your public domain (e.g. `gym.example.com`)
- `branchId` — the branch ID from the app (visible in the URL on the branch page)
- `DEVICE_TOKEN` — the value you set in `apps/api/.env`

---

## Day-to-day operations

### View logs
```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f nginx
```

### Restart a service
```bash
docker compose restart api
```

### Deploy an update (pull new code)
```bash
git pull
docker compose build
docker compose up -d
```

### Renew SSL certificate (automatic via certbot service)
The `certbot` container checks for renewal every 12 hours automatically.

To renew manually:
```bash
docker compose run --rm certbot renew --webroot -w /var/www/certbot
docker compose exec nginx nginx -s reload
```

Set up a host crontab for monthly forced renewal as backup:
```bash
crontab -e
# Add:
0 3 1 * * cd /path/to/gym && docker compose run --rm certbot renew --webroot -w /var/www/certbot && docker compose exec nginx nginx -s reload
```

### Stop everything
```bash
docker compose down
```

### Wipe everything including volumes (DESTRUCTIVE)
```bash
docker compose down -v
```

---

## Troubleshooting

**nginx won't start — "cannot load certificate"**
The SSL cert doesn't exist yet. Run `bash scripts/init-ssl.sh` first.

**API returns 502 Bad Gateway**
The API container may still be starting. Check: `docker compose logs api`

**Web returns 502 Bad Gateway**
The web container may still be starting. Check: `docker compose logs web`

**Certbot: "too many certificates"**
Let's Encrypt rate-limits to 5 certs per domain per week. Test with `--staging` flag first:
```bash
docker run --rm -p 80:80 \
  -v "$(docker compose config --volumes | grep certbot-certs | awk '{print $2}'):/etc/letsencrypt" \
  certbot/certbot certonly --standalone --staging -d $DOMAIN --email $EMAIL --agree-tos
```
