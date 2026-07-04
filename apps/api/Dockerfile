# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

# Install deps with cache layer (workspace config + both package.jsons).
# apps/api/prisma is copied here too (ahead of the rest of the source) because
# `pnpm install` triggers api's `postinstall` (`prisma generate`), which needs
# schema.prisma to already be present.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Build API
COPY apps/api apps/api
RUN pnpm --filter api build

# Produce a self-contained production deployment directory
RUN pnpm --filter api deploy --prod --legacy /api-prod

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /api-prod .

# .local/ is mounted as a Docker volume at runtime (upload storage only —
# member profile pictures; data persistence now lives in Postgres).
# prisma/schema.prisma + prisma/migrations/ are included by `pnpm deploy` from
# the package directory. `prisma` ships as a runtime (not dev) dependency
# specifically so `prisma migrate deploy` is available in this slim image.

EXPOSE 3002
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main"]
