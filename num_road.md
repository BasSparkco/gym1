# Organization Numbering Roadmap (num_road)

Goal: give every organization/tenant a unique two-letter code, chosen manually
at tenant creation, and prefix member/employee numbers with it
(`MEM-0001` → `PF-0001`, `EMP-0001` → `PF-E-0001`), per `numbering.md`.
Internal database IDs (`Tenant.id`, `Member.id`, etc.) are untouched — the
code is a display/business identifier only.

State verified 2026-08-15: numbering is already **per-tenant**
(`@@unique([tenantId, memberNumber])` / `@@unique([tenantId, employeeNumber])`
in `schema.prisma`), so this isn't fixing a DB collision — it's fixing
human-readability (`PF-125` vs `PG-125` vs today's ambiguous `MEM-0125` in
both). One non-production tenant exists (Platinum Fitness, RSA-imported —
see `apps/api/src/scripts/import-platinum-rsa-members.ts`), source CSVs
still on hand, so it can be discarded/re-imported per `numbering.md`. The
live prod "Demo Gym" tenant (`tenant-spark-gym`) is real traffic and needs
care, not a wipe.

## Decision: format

Following `numbering.md`'s stated final format exactly (kept asymmetric —
members get no entity-type letter since they're the dominant record type,
employees get `-E-` to disambiguate):

* Member: `{CODE}-{seq:4}` → `PF-0001`
* Employee: `{CODE}-E-{seq:4}` → `PF-E-0001`
* Code: 2 uppercase letters, globally unique across all tenants, chosen
  manually in agreement with the club at tenant-creation time.

This is a one-line template-string change if that decision is ever revisited
— nothing else in the plan depends on the exact separator.

## Decision: don't touch the generator call sites more than needed

The number generator is currently duplicated 3x (services) + reimplemented
2x (import scripts). Rather than patch all 5, extract one shared helper and
point every call site at it — this was already a latent bug risk (the
services' own comments note they're manually kept in sync).

---

## Phase 1 — Schema + shared numbering helper

- [x] **1.1 Add `Tenant.code`.** `code String? @unique` on `Tenant`
  (`apps/api/prisma/schema.prisma`). **Nullable at the DB level** — existing
  tenant rows have no code yet; app-level validation requires it for new
  tenants (see 2.1). Migration authored by hand (single nullable column +
  unique index, matching the exact pattern of migration
  `20260710000000_link_user_to_employee`) since the standalone
  `gym-dev-postgres` container isn't currently running on this box — applying
  it is 1.1b below.
- [x] **1.1b Apply + verify the migration.** *(done 2026-08-15)* Stood up a
  throwaway `gym-dev-postgres` container (matching `apps/api/.env`'s
  creds/port), ran `prisma migrate deploy` — all 26 migrations including the
  new one applied cleanly in order — confirmed `prisma migrate diff` shows
  zero drift between the resulting DB and `schema.prisma`, then
  `prisma generate` to refresh the TS client. Container torn down afterward
  (verification-only, no redis/minio/seed data set up). The **persistent**
  dev stack (redis + minio + seeded data, per `project_local_dev_workflow`
  memory) still needs to be (re)created before 1.2's helper can be
  exercised end-to-end via `pnpm dev:api`. Prod `gym-db-1` was not touched.
- [x] **1.2 Shared numbering helper.** *(done 2026-08-15)* New file
  `apps/api/src/common/org-numbering.ts`, exporting `nextMemberNumber` /
  `nextEmployeeNumber` (single-record, used by create endpoints) plus
  `nextMemberSequence` / `nextEmployeeSequence` / `nextSequenceFromNumbers` /
  `formatOrgNumber` / `memberNumberPrefix` / `employeeNumberPrefix` (lower-level
  pieces so bulk importers can seed the counter once and increment locally
  instead of re-querying per row). `orgCode: null` falls back to the legacy
  `MEM-`/`EMP-` prefix — behavior-preserving for every tenant until it gets a
  code (verified live, see below). Replaced the duplicated logic in all 5
  places:
  * `members.service.ts` `createMember` (was `getNextMemberNumber`)
  * `employees.service.ts` `createEmployee` (was inline)
  * `platform-admin-tenants.service.ts` `createTenant` (code always `null` for
    now — `CreateTenantInput` has no code field until Phase 2) and `addBranch`
    (uses the existing tenant's `code`, already fetched there)
  * `import-members-csv.ts`, `import-platinum-rsa-members.ts` — both now look
    up `tenant.code` and use the shared prefix/sequence/format functions
    instead of a hand-rolled regex.

  Verified: `tsc --noEmit` clean, full `nest build` clean, and a live check
  against a throwaway dev Postgres confirmed both paths — a code-less tenant
  still produces `MEM-0001`/`EMP-0001`/`MEM-0002` exactly as before, and a
  tenant with `code: "PF"` produces `PF-0001`/`PF-E-0001`. Container torn
  down after. Prod untouched.
- [x] **1.3 Code validation helper.** *(done 2026-08-15)* Added
  `validateOrgCode` to `PlatformAdminTenantsService`, mirroring
  `validateOwnerInput`'s shape exactly: format check (`^[A-Z]{2}$`, after
  trim+uppercase) then a case-insensitive `prisma.tenant.findFirst({ code })`
  uniqueness check, both throwing a friendly `BadRequestException`.

## Phase 2 — Tenant creation flow

*(2.1–2.2 done together 2026-08-15 — they only make sense wired up jointly;
2.3 turned out already done as part of 1.2, see below.)*

- [x] **2.1** Added `code` to `CreateTenantInput`, called `validateOrgCode`
  in `createTenant` before the transaction, stored `code` on the `Tenant`
  row, and passed it into the owner's `nextEmployeeNumber` call. Also added
  `code` to `TenantSummary` (API + web types) and populated it in all 4
  places a `TenantSummary` is returned (`listTenants`, `createTenant`,
  `updateTenantName`, `pauseTenant`, `resumeTenant`) — otherwise the code
  would be invisible to platform-admin staff after creation.
- [x] **2.2** Added an "Organization code" field to `tenants/new/page.tsx`
  (2-letter input, uppercase via CSS + `pattern`, `maxLength=2`, helper text
  explaining the uniqueness rule), threaded through the existing server
  action + `?error=` banner (no new UI pattern needed — a duplicate/bad-format
  code now surfaces the same way a taken owner email already did). Also
  surfaced `tenant.code` as a small badge on the tenant list
  (`platform-admin/page.tsx`) and in the detail page's description line
  (`tenants/[tenantId]/page.tsx`) — otherwise it'd be write-only.
- [x] **2.3** Already done in 1.2 — `members.service.ts` and
  `employees.service.ts` look up `tenant.code` and pass it to the shared
  helper.

  Verified live end-to-end against a throwaway dev Postgres (via
  `PlatformAdminTenantsService.createTenant` directly, not just the helper):
  `code: "pf"` → stored/returned as `"PF"`; owner's employeeNumber came out
  `PF-E-0001`; a second tenant with `code: "PF"` (different case) was
  rejected with the friendly duplicate-code message; `code: "G1"` was
  rejected with the format message. `tsc --noEmit` and `nest build` clean on
  both `apps/api` and `apps/web`. Container torn down after. Prod untouched.

## Phase 3 — Migrate the existing tenant(s)

- [x] **3.1 + 3.2 done together, live in prod (2026-08-15).** Discovered
  mid-phase that `tenant-ce5491e6-...` (Platinum RSA) already lives in the
  **production** DB (created 2026-08-10, not a sandbox) — so this phase
  meant a real prod deploy, not a local exercise. Confirmed with the user
  first (code = `PF`, go ahead with backup-then-deploy). Sequence:
  1. Fresh manual backup (`bash scripts/backup.sh` →
     `gym_db_20260815_143344.sql.gz` + matching MinIO archive).
  2. Built + deployed `gym-api`/`gym-web` images with all of Phase 1/2's
     code (`docker compose -f docker-compose.prod.yml build api web && ...
     up -d api web`) — `prisma migrate deploy` ran automatically on API
     boot (it's baked into the container's `CMD`), applied cleanly, `Nest
     application successfully started`, `Tenant.code` column + unique index
     confirmed present in prod.
  3. Before touching data: confirmed the tenant's 268 members were
     *provably* untouched-since-import (contiguous `MEM-0002..MEM-0269`,
     zero non-conforming numbers, only 1 employee = the owner from tenant
     creation, no other staff activity) — so delete+reimport was safe with
     nothing extra to lose. Source CSVs (`active members.csv`, `female.csv`,
     gitignored, repo root) confirmed still present and byte-for-byte the
     same data (`--dry-run` output matched live counts exactly: 268 rows,
     214 male/54 female, 257 with membership+payment, 11 profile-only).
  4. Set `Tenant.code = 'PF'` directly (same pattern as the 2026-07-31
     tenant-rename in `TenantRoad.md` 1.4).
  5. Deleted the tenant's 268 `Member` rows (cascade cleared 257
     Memberships + 252 Payments), re-ran the now-code-aware
     `import-platinum-rsa-members.js` for real inside `gym-api-1`. Result:
     268 members `PF-0001..PF-0268`, 257 memberships, 252 payments — exact
     match to pre-migration counts, just renumbered. Also renamed the
     owner's stale `EMP-0001` to `PF-E-0001` for consistency (single row,
     created before the code existed).
  6. Verified live: no errors in API logs, `platform-admin/login` returns
     200, Demo Gym's 107 members confirmed untouched (`tenant-spark-gym`
     wasn't touched by any of this).
- [ ] **3.3** Update seed/demo fixtures to match the new format so dev/e2e
  stay representative: `apps/api/src/scripts/seed-demo-data.ts`,
  `apps/api/src/data/operations-seed.ts`, `apps/api/src/prisma/seed-import.ts`
  — give the demo tenant a code (e.g. `DG`).
- [x] **3.4 decided (2026-08-15): Demo Gym stays as-is, no code.** User
  confirmed — it keeps the legacy `MEM-`/`EMP-` format indefinitely (the
  `orgCode: null` fallback in `org-numbering.ts` already handles this
  correctly, verified live). Not revisited unless the user asks later.

## Phase 4 — Verification

- [ ] **4.1** Unit tests for the Phase-1.2 helper: per-tenant sequence
  isolation, correct code prefix, gap/no-gap behavior on delete.
- [ ] **4.2** e2e: creating two tenants with the same code is rejected with a
  friendly error; a freshly created tenant's owner gets a correctly prefixed
  employee number; a new member in that tenant gets a correctly prefixed
  member number.
- [ ] **4.3** Manual check of `platform-admin/tenants/new` end-to-end in the
  local dev environment (see `project_local_dev_workflow` memory) — confirm
  the taken-code error renders correctly.
- [ ] **4.4** Full e2e suite green before calling this done (project baseline
  is 41/41 — see `project_ops_baseline` memory).

## Phase 5 — Rollout

- [x] **5.2 done as part of Phase 3 (2026-08-15).** Deployed via
  `docker-compose.prod.yml` with a fresh backup taken first — see Phase 3
  above for the full sequence. Superseded the original 5.1 assumption
  ("no live prod real-customer data yet") — Platinum RSA turned out to
  already be in prod, so its backfill happened for real, not deferred.
- [x] **5.1 resolved:** Demo Gym intentionally stays without a `code` (see
  3.4) — this is the final state, not a gap.

---

**Next step:** The core feature is live in production — Platinum RSA (`PF`)
is fully renumbered, Demo Gym is untouched and unaffected. Remaining work is
low-urgency polish: 3.3 (seed fixtures) and 3.4/5.1 (optionally give Demo
Gym a code too). Phase 4 (automated tests for the helper) hasn't been done —
worth doing before this drifts, since it's the only phase without any
regression coverage of its own.
