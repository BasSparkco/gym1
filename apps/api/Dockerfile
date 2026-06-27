# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

# Install deps with cache layer (workspace config + both package.jsons)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
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

# .local/ is mounted as a Docker volume at runtime (persistent store)
# data/ (seed JSON) is included by pnpm deploy from the package directory

EXPOSE 3002
CMD ["node", "dist/main"]
