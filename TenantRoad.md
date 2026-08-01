# Tenant Readiness Roadmap (TenantRoad)

Goal: serve multiple gyms (tenants) on the single production deployment at
`https://gym.sparkco.vip/`, with the first real customer onboarded as a new
tenant and full data isolation between gyms.

State verified 2026-07-30: schema is fully tenant-scoped, every staff/member
session carries `tenantId` server-side, the `/platform-admin` onboarding
surface works, and prod contains exactly one tenant (`tenant-spark-gym`,
demo/seeded data, 106 members, 3 branches).

---

## Decision: one stack, not two

**We keep a single production docker stack.** The real customer becomes a
*new tenant* created via `/platform-admin` — we do **not** clone the docker
compose stack for them.

Why:

* The whole point of the SaaS architecture is many tenants on one deployment
  and one URL. A second stack can't live at the same `gym.sparkco.vip` link,
  doubles every future deploy/migration/backup, and means the multi-tenant
  code path never actually gets exercised.
* Testing/updating already has a home: the `gym-dev-*` containers and the
  local `pnpm dev:api` / `pnpm dev:web` workflow. Prod is not the test bed.
* The existing demo tenant stays in prod as a *demo/sales tenant* — it's also
  our permanent isolation check (sign into demo, confirm no real-gym data is
  visible, and vice versa). If we later decide it's noise, we delete that one
  tenant's rows — not a whole environment.

Condition for keeping the demo tenant next to real data: its accounts must be
hardened first (see 1.3) — today its `*@sparkgym.local` users may still have
the seed passwords that are hashed in the repo.

---

## Phase 1 — Must fix BEFORE creating the real tenant

- [x] **1.1 Tenant-safe staff sign-in.** *(done 2026-07-31)*
  `AuthService.signIn` (`apps/api/src/modules/auth/auth.service.ts`) matches
  email/username across ALL tenants and takes the first hit. Fix:
  * check the password against **every** candidate, not just `users[0]`;
  * make `AuthService.createUser` reject a username/email already used in
    **any** tenant (today it checks email only; the auto-derived username —
    email prefix — can collide across tenants and lock a user out).
- [x] **1.2 Tenant-safe member (mobile) sign-in.** *(done 2026-07-31 —
  phone-only identifier, accepted as local digits with the branch country
  implied (`0500000001`) or full E.164 (`+972500000001`, required when the
  phone's country differs from the branch's); PIN checked against all
  candidates; PIN setup requires a phone and rejects a PIN already used by
  another member with the same phone or local digits in any tenant)*
  `MemberAuthService.signIn` (`apps/api/src/modules/member-auth/`) matches
  `memberNumber`/`phone` across ALL tenants with only the PIN as
  disambiguator — but every gym has an `MBR-0001`. Fix: sign in by phone
  only (enforce phone globally unique at PIN-setup time), or have the app
  send a tenant hint; verify PIN against all candidates either way.
- [x] **1.3 Harden the demo tenant's accounts.** *(done 2026-07-31 — all
  three staff passwords rotated in prod to strong random values (verified:
  old ones 401, new ones 200 against the live API); active staff sessions
  revoked; test PINs cleared for MEM-0001/0008/0014 and their app sessions
  revoked. MEM-0013 (mobile-dev test account) deliberately kept as-is. New
  credentials in `/root/gym-demo-cred-rotation.txt` (chmod 600, outside the
  repo) along with the old hashes as a rollback record. The seed hashes
  still committed in `auth.service.ts` are e2e/dev-only — prod no longer
  accepts those passwords.)*
- [x] **1.4 Rename the demo tenant clearly.** *(done 2026-07-31 — prod
  tenant `tenant-spark-gym` renamed "Platinum Fitness" → "Demo Gym"
  (equivalent to the `/platform-admin` rename — `updateTenantName` is a
  plain `Tenant.name` update); verified via live sign-in, session cleaned
  up. Branch names unchanged.)*

**Phase 1 complete and fully deployed (2026-07-31).** 1.1/1.2 shipped in the
API image (fresh backup `gym_db_20260731_103152.sql.gz` taken first; verified
live: both phone forms sign in, member numbers 401, staff sign-in works);
1.3/1.4 were applied directly to prod.

## Phase 2 — Onboard the first real customer

- [ ] **2.1 Create the tenant** via `/platform-admin/tenants/new`
  (tenant name, first branch + currency/country, owner account). Use a
  strong owner password; owner email/username must not collide with the
  demo tenant's.
- [ ] **2.2 Import their real member data** — adapt the existing one-off
  members CSV import script to take a `tenantId`/`branchId` argument and run
  it against the new tenant only.
- [ ] **2.3 Owner walkthrough**: sign in as the new owner, create membership
  plans, employees, staff user accounts, gates, lockers, programs as needed.
- [ ] **2.4 WhatsApp**: in the new tenant's settings, link their branch
  WhatsApp session (QR scan via the tenancy UI). Note: all tenants currently
  send through our single `SPARKCO_API_KEY` — acceptable for now, revisit in
  3.2.
- [ ] **2.5 Isolation smoke test (both directions)**: as demo owner, confirm
  zero real-customer data (members, payments, reports, dashboard, search,
  notifications); as real owner, confirm zero demo data. Also verify the
  member mobile endpoints (`/me/*`) with one demo and one real member.
- [ ] **2.6 Full e2e suite green (40/40)** after the Phase 1 changes, and a
  fresh DB backup taken right before go-live (backup script exists).

## Phase 3 — Before the second gym gets gate hardware / scale-up

- [ ] **3.1 Per-tenant (or per-branch) gate device tokens.**
  `BasIpDeviceGuard` uses one global `DEVICE_TOKEN` env var — any gym's
  device config URL contains a token valid for *every* gym's gates. Move to
  a token stored per tenant/branch and validate `branchId` against it.
  (Blocking only once a second gym installs BAS-IP hardware.)
- [ ] **3.2 Per-tenant SparkCo/WhatsApp accounts** (or at least per-tenant
  API keys) so messaging is billed and rate-limited per gym.
- [ ] **3.3 Two-tenant e2e coverage**: extend the e2e suite to seed two
  tenants and assert isolation on the endpoints that matter most
  (members search, reports, dashboard, `/me/*`).
- [ ] **3.4 Non-guessable IDs cleanup**: the legacy branch id
  `Platinum Fitness` is a guessable string; migrate it to a UUID id like
  every other branch (touches Users.branchId, gates, visits — do as a
  scripted migration).
- [ ] **3.5 Ops per tenant**: include tenant list in the backup routine docs;
  decide retention/deletion policy for a churned tenant.
