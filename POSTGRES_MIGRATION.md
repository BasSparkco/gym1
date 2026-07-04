# Postgres + Prisma migration (persistence layer)

**STATUS: LIVE IN PRODUCTION as of 2026-07-03 ~15:25 UTC.** `gym.sparkco.vip` is running on Postgres. See "Production cutover" section near the end for exactly what was done and how to roll back if needed.

Tracking doc for migrating the API's persistence from flat JSON files to PostgreSQL via Prisma, with real foreign keys. Started after a code review question: why does `Member.homeBranchId` / `registeredEmployeeId` use plain strings instead of FKs? Answer: there was no database at all — everything lived in `apps/api/src/data/operations-store.ts` / `settings-store.ts` and an inline store in `auth.service.ts`, read/written wholesale as JSON files.

Decisions locked in:
- **ORM: Prisma** (over TypeORM).
- **Data cutover:** migrate existing data from the live `api-data` volume into Postgres (one-time script), not just reseed from committed fixtures.
- **Self-hosted Postgres** via a new `db` service in the existing docker-compose setup.
- No repository/DAO layer — inject `PrismaService` directly into existing feature services.
- Land as incremental PRs, app keeps running throughout.

## Progress

### Phase 1 — Schema & plumbing — ✅ DONE

- [x] `apps/api/prisma/schema.prisma` — all 15 models (Tenant, Branch, Employee, EmployeeGate, Gate, Member, MembershipPlan, Membership, Freeze, Visit, Payment, Notification, TenantSettings, User, Session), enums, indexes, FKs.
- [x] Initial migration generated (`prisma/migrations/20260703074526_init/`, 15 tables, 27 FKs) and verified against a real Postgres container.
- [x] `PrismaService`/`PrismaModule` (`apps/api/src/prisma/`), wired globally into `app.module.ts`.
- [x] `db` service added to `docker-compose.yml` (dev) and `docker-compose.prod.yml` (prod, isolated on a new internal-only network, not exposed to `traefik-public`).
- [x] `Dockerfile` updated: copies `prisma/` early so `postinstall`'s `prisma generate` succeeds, `CMD` now runs `prisma migrate deploy` before `node dist/main`.
- [x] `.env.example` (root + `apps/api/`) documents `POSTGRES_PASSWORD` / `DATABASE_URL`.
- [x] Verified end-to-end: full `docker build`, boots against a real Postgres container, all routes mapped, and — the actual fix for the original question — inserting a `Member` row with a bogus `homeBranchId` now fails with a real Postgres FK-violation error instead of being silently accepted.
- [x] Existing test suite still passes (see "Gotchas hit" below for what had to change to keep it green).

**Nothing in `modules/*` has changed yet.** The app still reads/writes the JSON files exclusively for all actual business logic — Postgres exists and is reachable, but no feature module talks to it yet.

### Phase 2 — One-time data migration script — ✅ DONE

- [x] `apps/api/src/scripts/migrate-json-to-postgres.ts` — reads `.local/*.json`, derives `Tenant` rows (union of all `tenantId`s, name resolved from `auth-store.json`), inserts everything in FK order (Tenant → Branch → Employee → Gate → EmployeeGate → Member → MembershipPlan → Membership → Freeze → Visit → Payment → Notification → TenantSettings → User; Session intentionally skipped, 12h-lived), verifies row-count parity, hard-fails on mismatch.
- [x] Idempotency guard (`--force` required to re-run against a non-empty `Tenant` table); verified a plain re-run aborts, and `--force` re-run is a safe no-op (`skipDuplicates`, counts stay identical).
- [x] Verified end-to-end against the real local `.local/*.json` data (15 members, 17 memberships, 30 visits, etc.) — all 13 row-count checks passed, FK columns (`homeBranchId`, `registeredEmployeeId`) populated correctly, `role` enum mapping (`'front-desk'` → `frontDesk`) verified in the DB.
- [x] Runs manually only — never wired into `postinstall`/`CMD`. Command: `pnpm build && DATABASE_URL=... API_DATA_ROOT=... node dist/scripts/migrate-json-to-postgres.js [--force]` (see script header for the full recipe; also runnable via `pnpm migrate:json-to-postgres` once `DATABASE_URL`/`API_DATA_ROOT` are exported).
- [x] **Run against real production data** on cutover day — see "Production cutover" section below.

### Phase 3 — Module-by-module cutover — ✅ DONE

Order (lowest-risk first): `settings` → `branches`/`employees`/`gates` → `auth` → `members` → `memberships`/`visits`/`access` (shared join surface) → `payments`/`notifications` (+dispatch+scheduler) → `reports`. Each module: drop the JSON-store import, inject `PrismaService`, keep method signatures identical.

- [x] **`settings`** — `SettingsService` now reads/writes `prisma.tenantSettings` (`upsert` on update). Controller methods needed `await` added since the service methods are now `async` (nothing caught this in tests; it would have silently serialized `{}` for `settings` otherwise).
- [x] **`branches`/`employees`/`gates`** — straightforward CRUD conversions. `EmployeesService.createEmployee`'s sequence-number generation deliberately kept as an in-memory regex-filtered scan (matching the original exactly) rather than a SQL `MAX(employeeNumber)`, since a raw string max could misbehave if any non-conforming `employeeNumber` ever sorted lexicographically higher than the true numeric max.
- [x] **`auth`** — the big one. `AuthService` now backed entirely by `prisma.user`/`prisma.session`, with `Tenant` joined in (`include: { tenant: true }`) since `User` has no denormalized tenant-name column, only the FK. Session lookups filter `expiresAt > now()` lazily at query time instead of an eager `pruneExpiredSessions()` array-filter-then-write; no scheduled cleanup job added yet (expired rows just accumulate harmlessly for now — noted as a fast-follow). **This cascaded into every controller in the app**: `getCurrentSessionFromCookieHeader`/`getCurrentSession` are now async, and that one call sits as literally the first line of nearly every request handler (14 controllers, ~50 call sites, plus `tenancy.controller.ts`'s custom `session()` helper and `bas-ip.controller.ts`). Converted all of them (`async`/`await` mechanically added, no logic changes).
- [x] **`members`** — `MembersService` fully on Prisma. Added an explicit FK-validation error for `registeredEmployeeId` (`BadRequestException` if it doesn't resolve for the tenant) — the original never validated this field at all, silently storing garbage; this is the direct, concrete fix for the original code-review question.
- [x] **`memberships`/`visits`/`access`** — the heaviest joiner. `renewMembership`/`createFreeze` use `$transaction` for their two-write flows (expire-old+create-new; extend-membership+insert-freeze). `previousMembershipId` is now a real self-relation FK (a bad reference throws instead of silently orphaning). `access.service.ts`'s `resolveMember` for QR/input-code identifiers still does a full tenant-member scan in memory (not a single indexed query), since `memberIdToUuid()` is a computed transform of the id, not a stored column — correctness over cleverness for an access-control path. **Also fixed `bas-ip.controller.ts`**, which read gates directly from the JSON store (bypassing `GatesService` entirely) — a second cross-module gap from Phase 3b that would've made new gates invisible to hardware sync.
- [x] **`payments`/`notifications`** (+dispatch+scheduler) — closes the settings↔notifications gap noted below. `NotificationsSchedulerService.listTenantIds()` now queries `Tenant` directly instead of deriving distinct tenant IDs from members — a small simplification the FK migration enables.
- [x] **`reports`** — turned out to need real changes, not just verification: `getActiveMembershipsReport`/`getExpiredMembershipsReport`/`getVisitsReport`/`getPaymentsReport` all read `readOperationsStore()` directly (bypassing the other services), so each needed its own Prisma conversion as its upstream data moved off JSON. Only `getDashboardSummary` matched the original "calls other services" assumption.

**Two urgent cross-module cascades hit during this phase** (not edge cases — they broke core flows immediately):
1. After `members` converted but before `memberships` did, creating a member then a membership for it returned 400 ("member not found") — `memberships.service.ts` still validated against the JSON store, which the new member never touched. Forced immediately proceeding into `memberships`/`visits`/`access` rather than pausing between phases.
2. Same pattern after `memberships` converted but before `payments`/`notifications` did — payment/notification creation 400'd or silently failed for anything created post-cutover. Same forced-immediate-continuation logic applied.

Net effect: **phases 3d–3g had to land together in one continuous pass**, not as separately reviewable steps as originally planned — any half-converted intermediate state actively breaks the app for records created after the cutover point, not just "shows stale data" as anticipated for the settings↔notifications gap.

**Cross-module consistency gap from `settings` (Phase 3a), now closed:** `notifications.service.ts`/`notification-dispatch.service.ts` read tenant notification preferences via `readSettingsStore()` even after `settings` moved to Postgres. Fixed as part of the `payments`/`notifications` step.

**Phase 5 pulled forward, out of necessity:** `TenantSettings.tenantId` has a required FK to `Tenant`, and the e2e suite exercises `PATCH /settings`. This meant the existing `API_DATA_ROOT`-temp-dir-only test isolation was no longer sufficient the moment any module touched Prisma. Implemented a minimal version of Phase 5 now rather than deferring it:
- `apps/api/test/jest-e2e-setup.ts` (Jest `globalSetup`) — points `DATABASE_URL` at a dedicated test database (`gym_test`, separate from local dev's `gym` database, same Postgres instance) and runs `prisma migrate deploy` once before the suite.
- `apps/api/test/prisma-test-utils.ts` — `resetPrismaTestData()`, a single `TRUNCATE ... CASCADE` (not per-model `deleteMany()` — see gotcha #12 below) followed by re-seeding via the same `defaultOperationsSeed`/`defaultAuthSeed`/default settings the JSON-store reset already uses (via a newly shared `apps/api/src/prisma/seed-import.ts`, extracted out of the migration script so both call sites share one mapping implementation).
- `app.e2e-spec.ts`'s `beforeEach` now also calls `resetPrismaTestData(testPrisma)`, and a new `afterEach(() => app.close())` was added (previously missing entirely — see gotcha #12).
- Full Phase 5 (replacing the JSON-store side of test isolation too) is still open — this is just enough Postgres-side isolation to keep the suite meaningful as more modules convert.

**Local dev Postgres:** a persistent `gym-dev-postgres` container (not part of docker-compose) runs on `127.0.0.1:5434` for this machine's local `pnpm start:dev`/manual testing, with two databases: `gym` (dev, matches `apps/api/.env`'s `DATABASE_URL`) and `gym_test` (e2e, matches `jest-e2e-setup.ts`'s default `TEST_DATABASE_URL` fallback). Ports 5432/5433 were already taken by other projects on this host.

### Phase 4 — Cleanup — ⬜ NOT STARTED (waiting on burn-in period)

`grep -rn "readOperationsStore\|writeOperationsStore\|readSettingsStore\|writeSettingsStore"` across `src/` returns **nothing outside the store definition files themselves and the migration script/seed-import helper** (which legitimately still read the JSON for one-time-migration purposes) — confirmed via a full sweep after Phase 3. Code-ready; waiting on a burn-in period in production before deleting `operations-store.ts`, `settings-store.ts`, the inline auth store remnants, and `*-seed.json` files. The old JSON files in the `api-data` volume are also being kept as a rollback reference for now (see below) — don't delete them from the volume either until well past the burn-in window.

### Phase 5 — E2E test adaptation — ✅ DONE

- [x] Removed the JSON-store side of `app.e2e-spec.ts`'s isolation (the per-test delete/recreate of `auth-store.json`/`operations-store.json`/`operations-seed.json`) — dead weight now that nothing in the app reads those files. `beforeEach` now only does two things: `mkdirSync(testDataRoot)` (still needed — `API_DATA_ROOT` isolates file uploads/member photos from the real `.local/` dir) and `resetPrismaTestData(testPrisma)`.
- [x] Verified: e2e suite still 30/32 (same 2 pre-existing failures) after the simplification.

## Production cutover — DONE (2026-07-03 ~15:25 UTC)

Executed against the live `gym.sparkco.vip` deployment (project `gym`, `docker-compose.prod.yml`, containers `gym-api-1`/`gym-web-1`, up 43h at cutover time). Sequence:

1. **Backup first.** `gym_api-data` volume (the 3 JSON store files) tarred to `/opt/sites/gym/backups/gym_api-data_pre-postgres-cutover_<timestamp>.tar.gz` before touching anything. Kept as the rollback reference.
2. Added `POSTGRES_PASSWORD` (random 24-byte hex) to the root `/opt/sites/gym/.env` — the only env change needed; `apps/api/.env`'s `DATABASE_URL` is overridden by `docker-compose.prod.yml`'s `environment:` block regardless.
3. `docker compose -f docker-compose.prod.yml --env-file .env build api` — built the new image without touching the running containers.
4. `docker compose -f docker-compose.prod.yml --env-file .env up -d db` — started Postgres alongside the still-running old `api`/`web` (confirmed untouched, still "Up 43 hours" after this step). Waited for `health: healthy`.
5. **The real migration**, as a one-off container using the new image against the actual `gym_api-data` volume (already mounted by the `api` service definition): `docker compose -f docker-compose.prod.yml --env-file .env run --rm api sh -c "node_modules/.bin/prisma migrate deploy && node dist/scripts/migrate-json-to-postgres.js"`. All 12 row-count checks passed: 3 branches, 5 employees, 2 gates, 15 members, 5 plans, 17 memberships, 1 freeze, 30 visits, 16 payments, **23 notifications** (more than the 15 seen in local dev data — confirms this was real accumulated production data, not just seed fixtures), 1 tenant settings row, 2 users.
6. Spot-checked the imported data via `psql` (real Arabic member names, correct tenant, correct user roles) before cutting over.
7. **Cutover itself:** `docker compose -f docker-compose.prod.yml --env-file .env up -d` — recreated `gym-api-1` (brief restart, expected); `gym-web-1` untouched (image unchanged).
8. Verified: container boots clean (all routes mapped, zero errors in logs), sign-in works with real production credentials (`owner@sparkgym.local`), and — most importantly — verified through the **actual public domain** `https://gym.sparkco.vip` (API health check + web app renders/redirects correctly through Traefik), not just container-internal checks.

**Rollback path if needed:** the pre-cutover backup tarball has the original JSON files; `docker-compose.prod.yml`'s previous version (before this migration) can be restored from git history and redeployed with the old image, and the `gym_api-data` volume's JSON files are untouched (migration only reads them, never writes/deletes) — restoring service would just mean reverting the compose file and image, no data restore needed unless the volume itself gets corrupted separately.

## Gotchas hit during Phases 3d–3f (the module conversions)

1. **Prisma `Decimal` fields serialize to STRINGS via `JSON.stringify`**, not numbers (`Decimal.prototype.toJSON()` returns `.toString()`). Confirmed empirically. This silently breaks the web app, which calls `.toLocaleString()` directly on `finalPrice`/`amount`/`price`/`salary` in report pages — a string has no such method, so it would throw at render time. Added a shared `toNumber()` helper (`apps/api/src/common/decimal.ts`) and applied it at the serialization boundary in every service returning `Employee.salary`, `MembershipPlan.price`, `Membership.finalPrice`, `Payment.amount`.
2. **Prisma `@db.Date` columns come back as JS `Date` objects**, not `"YYYY-MM-DD"` strings — the original JSON store's date-only fields (`Member.dateOfBirth`/`joinDate`, `Employee.dateOfBirth`/`startDate`/`endDate`, `Membership.startDate`/`endDate`, `Freeze.startDate`/`endDate`) were plain strings. A full ISO datetime string in their place breaks raw string comparisons (`apps/web/.../members/page.tsx` filters `membership.endDate >= todayStr && membership.endDate <= thirtyDaysStr` — technically still sorts correctly by luck of ISO-prefix ordering in most cases, but the *equality* boundary case breaks: `"2026-07-10" <= "2026-07-10T00:00:00.000Z"` is `false`, since the shorter string is a prefix of the longer one) and would show a raw ISO timestamp in any UI that displays the field as plain text. Added `toDateOnlyString()` to `apps/api/src/common/date.ts`, applied at the same serialization boundary as `toNumber()`.
3. **The auth cascade (async `getCurrentSession`) forced touching every controller**, not just `auth.controller.ts` — confirmed and executed methodically (grep for `getRequiredSession`/`getCurrentSessionFromCookieHeader`, batch-fix the shared helper pattern with a script, then hand-fix each controller's own call sites and `async` keywords). No shortcuts taken here since a missed `await` fails silently (a `Promise` object gets serialized as `{}` in the JSON response, not a visible error) rather than throwing.
4. **Cross-module conversions cannot be safely paused mid-sequence.** Converting `members` alone (leaving `memberships` on JSON) actively breaks member-then-membership creation with 400s, not just stale reads. Same for `memberships` → `payments`/`notifications`. This contradicts the original plan's assumption that each module conversion was independently shippable — in practice, once one module in a dependency chain moves to Postgres, every other module that looks up its records by ID must move together, or the chain breaks immediately for new records.

## Gotchas hit during Phase 1 (useful if this breaks again)

Prisma is now on v7 (was v6 when this plan was researched), which changed several conventions:

1. **Driver adapters are mandatory.** `new PrismaClient()` alone no longer works — needs `@prisma/adapter-pg` + `pg`, constructed with a connection string and passed as `super({ adapter })` in `PrismaService`.
2. **New generator + output path.** `generator client { provider = "prisma-client", output = "../src/generated/prisma" }` (not `prisma-client-js`, not `node_modules/@prisma/client`). Import `PrismaClient` from `../generated/prisma/client`, not from `@prisma/client` directly.
3. **`moduleFormat = "cjs"` is required** in the generator block — without it, the generated client defaults to ESM output and crashes on boot (`ReferenceError: exports is not defined in ES module scope`) since this whole project builds as CommonJS.
4. **`prisma.config.ts`** (new, at `apps/api/`) replaces the schema's inline `datasource url` for CLI purposes (`migrate`, `generate`, `studio`). It does `import "dotenv/config"`, so `dotenv` had to be added — as a **regular** dependency, not dev, since the CLI runs inside the production container too (see next point).
5. **`prisma` (the CLI) and `dotenv` must be regular dependencies**, not devDependencies — `pnpm --filter api deploy --prod` strips devDependencies, and the Docker image runs `prisma migrate deploy` at container boot.
6. **Dockerfile layer ordering:** `apps/api/prisma/` must be copied *before* `pnpm install --frozen-lockfile`, because that install triggers the `postinstall` script (`prisma generate`), which needs `schema.prisma` to exist.
7. **Jest + `ts-jest` needs a `moduleNameMapper`** (`"^(\\.{1,2}/.*)\\.js$": "$1"`) in both jest configs — the generated Prisma source uses NodeNext-style `.js`-suffixed imports pointing at `.ts` files, which `tsc` resolves fine but Jest's resolver doesn't, without the mapping.
8. **`test:e2e` needs `NODE_OPTIONS=--experimental-vm-modules`** — Prisma 7's WASM query compiler lazy-loads via dynamic `import()`, which Jest's default CJS test environment can't execute without that flag. Only `test:e2e` needs it (unit tests never boot `AppModule`/`PrismaService`).
9. `prisma init` appends a placeholder `DATABASE_URL` line straight into whatever `.env` file already exists at the schema's root — it edited the **real** `apps/api/.env` (not just `.env.example`). Had to replace the placeholder with a real value manually. Worth double-checking after any future `prisma init`/`prisma generate` run.
10. **The migration script lives at `src/scripts/`, not a top-level `scripts/`**, and must be run from its **compiled** `dist/scripts/migrate-json-to-postgres.js` output (`pnpm build` first), not via `ts-node` directly. `ts-node`'s CJS require hook can't resolve the generated Prisma client's NodeNext-style `.js`-suffixed imports pointing at `.ts` files (same underlying issue as the Jest `moduleNameMapper` above, but there's no equivalent one-line fix for ts-node's runtime resolution — building first sidesteps it entirely, and mirrors how the app itself always runs from `dist/`).
11. **Stale `tsconfig.build.tsbuildinfo` can make `nest build` silently no-op** after a manual `rm -rf dist` — TypeScript's incremental cache thinks outputs already exist and skips emitting, with exit code 0 and zero files written. Delete `tsconfig.build.tsbuildinfo` too if `dist/` ever looks incomplete after a build. Hit this twice — once where the whole `dist/` was empty, once where only `dist/main.js` specifically was missing while everything else emitted fine.
12. **`app.e2e-spec.ts` never called `app.close()` between tests** (pre-existing gap — harmless with synchronous JSON-file I/O, since there was nothing async to leak). Once a module talks to Postgres, a previous test's un-closed `NestJS` app can race a later test's database reset. Symptom looked bizarre: a `TenantSettings` FK-violation error got attributed to a completely unrelated later test ("unfreezes a frozen membership...") because Jest attributes late-surfacing errors to whichever test is running when they land. Fixed by adding `afterEach(() => app.close())`. Also switched the Postgres reset itself from a sequence of per-model `deleteMany()` calls to one `TRUNCATE ... CASCADE` statement — atomic and FK-order-agnostic, so it can't race itself either.

Two of 32 e2e tests fail (`dashboard summary` counts, one member's computed `status`) — **confirmed pre-existing and unrelated to this migration** (verified by re-running the suite with `PrismaModule` temporarily removed from `app.module.ts`: identical 2 failures either way). Root cause looks like date drift between the seed data's fixed dates and the actual current date — not something this migration should fix.

## Full detailed plan

The original detailed plan (schema rationale field-by-field, per-module rewrite code sketches, migration script design, sequencing rationale) is at `~/.claude/plans/shiny-booping-pizza.md` on this machine. This file is the living/updated tracker; that one is the frozen original proposal.
