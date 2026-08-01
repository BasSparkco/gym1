

# Platform-Admin Console Roadmap (PlatformRoadmap)

Goal: turn `/platform-admin` from a bare tenant-creation form into the
grand-admin control panel for the whole SaaS — create organizations, manage
their owners/branches, pause/resume service with a reason, and (later) tie
billing/plans to branch count. Related but distinct from
[TenantRoad.md](TenantRoad.md), which tracks *onboarding the first real
customer*; this doc tracks the *admin tooling* itself.

State verified 2026-07-31: `/platform-admin` (own session model, cookie
`spark_platform_admin_session`, gated by `requirePlatformAdminSession()`,
[apps/web/src/lib/platform-admin.ts:90](apps/web/src/lib/platform-admin.ts#L90))
currently supports exactly three things, all in
[PlatformAdminTenantsService](apps/api/src/modules/platform-admin/platform-admin-tenants.service.ts):

- `listTenants` — dashboard list with branch count + owner email
- `createTenant` — full flow: tenant + first branch + owner user, one
  transaction ([platform-admin-tenants.service.ts:54](apps/api/src/modules/platform-admin/platform-admin-tenants.service.ts#L54))
- `updateTenantName` — the only thing the tenant detail page currently
  exposes ([platform-admin-tenants.service.ts:149](apps/api/src/modules/platform-admin/platform-admin-tenants.service.ts#L149))

No pause/suspend, no per-tenant status of any kind, no way to add a branch
(with its own owner) to an *existing* tenant, no organization-level billing
or plan concept. `Tenant` model
([apps/api/prisma/schema.prisma:150](apps/api/prisma/schema.prisma#L150)) has
only `id`, `name`, `createdAt` + relations — no status field. `Branch` has
its own `status active|inactive` ([schema.prisma:22](apps/api/prisma/schema.prisma#L22)),
unrelated to organization-level pause.

Sign-in today (`AuthService.signIn`,
[auth.service.ts:148](apps/api/src/modules/auth/auth.service.ts#L148), and
`MemberAuthService`) never checks tenant status — there isn't one.

**Note: platform-admin is English-only, LTR-only, by design.** It's an
internal-only surface for the grand admin (you), not tenant-facing — no
i18n needed, ever. Bug found 2026-07-31: the shared root layout
([apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx)) reads the
`spark_gym_lang` cookie and sets `dir`/`lang` on `<html>` for *every* route,
including `/platform-admin`, because Next.js only allows one root layout
per app tree. So switching language on `/app/dashboard` was flipping
`/platform-admin` to RTL too, even though platform-admin pages never call
the i18n system themselves. Fixed by detecting the path (via middleware
injecting `x-pathname`) and forcing `lang="en"`/`dir="ltr"` whenever the
path starts with `/platform-admin`, regardless of the cookie. If you ever
add a language switcher or any translated text inside `/platform-admin`,
that's a deliberate reversal of this decision — don't do it by accident.

---

## Phase 1 — Schema: organization status

- [x] **1.1** *(done 2026-07-31)* Added `TenantStatus { active, paused }`
  enum and `Tenant.status` (default `active`), `Tenant.pausedReason
  String?`, `Tenant.pausedAt DateTime?` to `schema.prisma`
  ([schema.prisma:148](apps/api/prisma/schema.prisma#L148)); migration
  `20260731154537_tenant_status`, applied to dev + test DBs. Dropped the
  originally-sketched `pausedByPlatformAdminId` — no per-admin audit trail
  needed yet since there's only ever one grand admin; add later if that
  changes.

## Phase 2 — Backend: pause/resume + login enforcement

- [x] **2.1** *(done 2026-07-31)*
  `PlatformAdminTenantsService.pauseTenant(tenantId, reason)` /
  `resumeTenant(tenantId)`
  ([platform-admin-tenants.service.ts](apps/api/src/modules/platform-admin/platform-admin-tenants.service.ts));
  `status`/`pausedReason`/`pausedAt` now included in `TenantSummary` and
  `listTenants`.
- [x] **2.2** *(done 2026-07-31)* New controller routes:
  `PATCH /platform-admin/tenants/:id/pause` (body: `reason`, required),
  `PATCH /platform-admin/tenants/:id/resume`.
- [x] **2.3** *(done 2026-07-31)* Sign-in blocked for paused tenants in
  **both** `AuthService.signIn`
  ([auth.service.ts:171](apps/api/src/modules/auth/auth.service.ts#L171))
  and `MemberAuthService.signIn`
  ([member-auth.service.ts](apps/api/src/modules/member-auth/member-auth.service.ts)).
  Both throw `ForbiddenException({ code: 'TENANT_PAUSED', message, reason })`
  → HTTP 403, distinguishable from the generic 401 "invalid credentials" —
  frontend (Phase 3) checks `code` and renders the paused screen. 41/41
  e2e still green.
- [x] **2.4** Decided: pausing blocks *new* sign-ins only — existing
  sessions are left alone (no session-store changes). Revisit if that
  turns out to be insufficient.

## Phase 3 — Frontend: paused-organization screen

- [x] **3.1** *(done 2026-07-31)* Staff/owner sign-in
  ([sign-in-form.tsx](apps/web/src/components/auth/sign-in-form.tsx)): on
  `TENANT_PAUSED` shows a dedicated "This organization has been paused"
  block with the reason, instead of the normal error banner. Verified via
  Playwright against the real sign-in flow (screenshot confirmed) — round
  trip pause → blocked sign-in with reason shown → resume → sign-in works
  again, all live against the dev DB/API.
- [ ] **3.2** Mobile/member app sign-in: same treatment for the `/me` auth
  flow. **Not done — the mobile app is a separate codebase, not present in
  this repo.** The API already returns the same `{ code: 'TENANT_PAUSED',
  reason }` 403 for `MemberAuthService.signIn`; the mobile client needs its
  own change to handle it. Flag this to whoever maintains that codebase.

## Phase 4 — Frontend: platform-admin dashboard controls

- [x] **4.1** *(done 2026-07-31)* Dashboard tenant list
  ([page.tsx](apps/web/src/app/platform-admin/(protected)/page.tsx)): a
  "Paused" badge next to a tenant's name when paused. Kept the actual
  pause/resume controls on the detail page only (4.2) rather than adding a
  dialog to the list row — matches the existing pattern where rename also
  only happens on the detail page, and avoids a from-scratch modal
  component for a single grand-admin user.
- [x] **4.2** *(done 2026-07-31)* Tenant detail page
  ([tenants/[tenantId]/page.tsx](apps/web/src/app/platform-admin/(protected)/tenants/[tenantId]/page.tsx)):
  new "Service status" section — active tenants get a reason textarea +
  "Pause organization" button; paused tenants show the reason + paused-at
  timestamp + a "Resume organization" button.

## Phase 5 — Branch + branch-owner management for existing tenants

- [x] **5.1** *(done 2026-07-31)* Factored branch+owner-creation out of
  `createTenant` into private `validateBranchInput`/`validateOwnerInput`
  helpers on
  [platform-admin-tenants.service.ts](apps/api/src/modules/platform-admin/platform-admin-tenants.service.ts),
  reused by both `createTenant` and the new `addBranch`. Note: `User.branchId`
  isn't an actual Prisma FK to `Branch` (just a denormalized string, same as
  the existing `branchName` field) — `listBranches` below matches owners to
  branches by querying `User` separately and grouping in application code,
  not a Prisma `include`.
- [x] **5.2** *(done 2026-07-31)* New endpoints:
  `GET /platform-admin/tenants/:id/branches` (list, with each branch's owner
  email) and `POST /platform-admin/tenants/:id/branches` (add a branch + its
  owner user to an *existing* tenant, same collision checks as tenant
  creation).
- [x] **5.3** *(done 2026-07-31)* Tenant detail page
  ([tenants/[tenantId]/page.tsx](apps/web/src/app/platform-admin/(protected)/tenants/[tenantId]/page.tsx))
  gained a "Branches" section listing every branch + its owner, and an
  "Add branch" button linking to a new form page
  ([tenants/[tenantId]/branches/new/page.tsx](apps/web/src/app/platform-admin/(protected)/tenants/[tenantId]/branches/new/page.tsx))
  mirroring the tenant-creation branch+owner fields. This is "create branch
  owner user" in practice — a branch always has an owner, so branch-add and
  owner-add are the same action. Verified live: added a branch via the API,
  its owner signed in successfully, detail page rendered the new branch
  (screenshot-checked); cleaned up the test branch/owner/admin afterward.
  41/41 e2e still green.

## Phase 6 — Accounting / plans (not started, tracked here for later)

- [ ] **6.1** Design: what's billed — per-branch, per-seat, flat plan tiers?
- [ ] **6.2** `Plan`/`Subscription`-shaped schema once 6.1 is decided; likely
  hangs off `Tenant`.
- [ ] **6.3** Platform-admin surfacing: show plan + branch count + computed
  cost per tenant.

Explicitly out of scope until requested: self-service billing UI for
tenant owners, usage metering, payment processor integration.
