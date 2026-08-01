# Spark Gym ERP — Server Dev Guide (start2)

Daily reference for developing and testing **on the production server** using
the dev environment. Replaces the old local-computer workflow in `start.md`.

Golden rule: **never rebuild the prod containers just to test a change.**
Prod (`docker-compose.prod.yml`) is only touched to deploy a finished change.

---

## The Dev Environment (already running on this server)

Separate containers, bound to `127.0.0.1` only — fully isolated from prod:

| Container          | Host port | Purpose        |
| ------------------ | --------- | -------------- |
| `gym-dev-postgres` | 5434      | dev database   |
| `gym-dev-redis`    | 6381      | dev sessions   |
| `gym-dev-minio`    | 9102/9103 | dev file store |

`apps/api/.env` already points `DATABASE_URL` / `REDIS_URL` at these dev
ports, so `pnpm dev:api` can never touch the real database.

---

## Daily Start

Terminal 1 — frontend (port 6001 matches the API's CORS config;
**3001 is taken by the Lumina dashboard on this server — never use or kill it**):

```bash
PORT=6001 pnpm dev:web
```

Terminal 2 — backend (port 3002 comes from `apps/api/.env`):

```bash
pnpm dev:api
```

Both hot-reload on every file save.

---

## Seeing It in Your Browser (VS Code port forwarding)

The dev servers listen on the *server's* localhost. VS Code Remote tunnels
them to your computer:

1. Open the **Ports** panel in VS Code (tab next to Terminal).
2. Make sure ports **6001** and **3002** are forwarded. VS Code usually
   auto-detects 6001 (Next.js prints its URL) but **misses 3002** — NestJS
   doesn't print one. Add it once manually: Ports panel → **Forward a Port**
   → `3002`. VS Code remembers it for this workspace.
   Sign-in failing with "The API is unavailable" while both servers run
   means exactly this: 3002 isn't forwarded.
3. On your own computer, open:

```text
http://localhost:6001
```

The browser reaches the web app on 6001 and the API on 3002 through the SSH
tunnel — sign-in, CORS, everything works as if it ran locally.

---

## Refreshing the Dev Database from Prod

Copies real/demo data **prod → dev** (never the other direction). Wipes the
dev DB. Run from the project root:

```bash
docker exec gym-db-1 pg_dump -U gym -d gym > /tmp/prod-snapshot.sql
docker exec gym-dev-postgres psql -U gym -d gym \
  -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
docker exec -i gym-dev-postgres psql -U gym -d gym -q < /tmp/prod-snapshot.sql
cd apps/api && npx prisma migrate deploy && cd ../..   # re-apply any repo migrations newer than prod
rm /tmp/prod-snapshot.sql
```

Last refreshed: 2026-07-30. MinIO files (logos/photos) are not copied —
images may 404 in dev; that's expected.

---

## Schema Changes (Prisma)

New migrations are created and tested against the **dev** DB first:

```bash
cd apps/api
npx prisma migrate dev --name <change-name>
```

Prod gets the migration later during deploy (`prisma migrate deploy` runs
against prod as part of the container build/startup flow).

---

## Tests

```bash
pnpm test:api
```

The e2e suite is the release gate: 40/40 green is the baseline — any failure
is a real regression, not flakiness.

---

## Deploying a Finished Change to Prod

Only after it works in dev and tests pass:

```bash
docker compose -f docker-compose.prod.yml up -d --build api web
```

Then smoke-check `https://gym.sparkco.vip` (sign-in + one or two screens).

Notes:

* Always use `docker-compose.prod.yml` — the plain `docker-compose.yml` is
  not the prod stack.
* `pnpm-lock.yaml` is gitignored — if you ever build from a clean checkout,
  copy the lockfile in first.

---

## If the Backend Says MODULE_NOT_FOUND (dist/main)

A stale build cache made tsc emit nothing into a wiped `dist/`. Fixed
permanently on 2026-07-30 (`tsBuildInfoFile` now lives inside `dist/`), but
if it ever comes back:

```bash
cd apps/api
rm -f tsconfig.build.tsbuildinfo dist/tsconfig.build.tsbuildinfo
pnpm exec nest build     # must produce dist/main.js
cd ../..
pnpm dev:api
```

If a port is already in use, an orphaned dev server from an old session is
still bound. Find it and kill **only** that PID (shared server — never
`pkill` by pattern):

```bash
ss -ltnp | grep -E ':3002|:6001'
readlink /proc/<pid>/cwd    # must be /opt/sites/gym/... before you kill it
kill <pid>
```

---

## Stopping

`Ctrl+C` in each dev-server terminal. The `gym-dev-*` containers stay up
(they're cheap); prod is untouched throughout.
