# Backend Task — Explore Tab Endpoints: `GET /api/me/courses` + `GET /api/me/plans` (2026-08-07)

Task for: Hamza
Repo: gym ERP monorepo (this repo) — all changes go in `apps/api` only.
Reviewed and approved by Basel; this doc is the agreed scope. If anything here doesn't
match what you find in the code, stop and ask — don't improvise around it.

## Context

The app's new **Explore** tab lets a member browse the gym's courses and membership
plans. The Android side is already built and calls two endpoints that don't exist yet;
until they ship the tab shows an error/retry state. Both endpoints are **pure reads** of
existing data:

- No schema change, no migration, no new tables.
- No new services or business logic — reuse two existing service methods.
- No write path — "Subscribe" in the app is local-only for v1 (see notes at the end).

**The response contracts below are fixed** — the shipped app already parses them.
Don't rename fields or change nesting.

---

## 1. Response contracts (fixed)

### `GET /api/me/courses`

Auth: member bearer token, like every other `/me/*` route. Returns the member-visible
course catalog: the member's home-branch courses plus tenant-global ones, **active only**.

```json
{
  "courses": [
    {
      "id": "program-…",
      "name": "…",
      "description": "…",        // may be null
      "price": 100,               // number, not string
      "maxMembers": 20,           // may be null
      "startDate": "2026-09-01",  // "YYYY-MM-DD" or null
      "endDate": "2026-11-30"     // "YYYY-MM-DD" or null
    }
  ]
}
```

Exactly these 7 fields per course — nothing else. In particular do **not** include
`active`, `tenantId`, `branchId`, `defaultCoachId`, `color`, or `icon` (they exist on
the record the service returns; the handler must strip them — see Pitfall #1).

### `GET /api/me/plans`

Auth: same. Returns every membership plan of the member's tenant, in the exact same
shape the staff endpoint `GET /api/memberships/plans` returns (the serializer already
produces this — pass it through unchanged):

```json
{
  "plans": [
    {
      "id": "plan-…",
      "tenantId": "tenant-…",
      "name": "…",
      "planType": "duration",     // "duration" | "session"
      "durationDays": 30,          // null for session plans
      "sessionCount": null,        // null for duration plans
      "price": 200,                // number
      "allowAllBranches": true,
      "freezeAllowed": false,
      "freezeMaxDays": null,
      "allowAllPrograms": true
    }
  ]
}
```

---

## 2. The only two files to change

### a) `apps/api/src/modules/member-auth/member-auth.module.ts`

Add `TrainingProgramsModule` to the `imports` array (it already
`exports: [TrainingProgramsService]`, so nothing to change on its side).

`MembershipsModule` is **already imported** and `MembershipsService` is **already
injected** into `MeController` — the plans endpoint needs zero wiring. Don't add
anything for it.

### b) `apps/api/src/modules/member-auth/me.controller.ts`

Add `TrainingProgramsService` to the constructor, and two handlers following the exact
pattern of the existing ones (e.g. `getMemberships`): call
`this.getRequiredMemberSession(request)` first, then a service scoped by the session.

```ts
@Get('courses')
async getCourses(@Req() request: Request) {
  const session = await this.getRequiredMemberSession(request);
  const programs = await this.trainingProgramsService.listProgramsForTenant(
    session.tenantId,
    session.homeBranchId,
  );
  return {
    courses: programs
      .filter((program) => program.active)
      .map((program) => ({
        id: program.id,
        name: program.name,
        description: program.description,
        price: program.price,
        maxMembers: program.maxMembers,
        startDate: program.startDate,
        endDate: program.endDate,
      })),
  };
}

@Get('plans')
async getPlans(@Req() request: Request) {
  const session = await this.getRequiredMemberSession(request);
  return {
    plans: await this.membershipsService.listMembershipPlansForTenant(
      session.tenantId,
    ),
  };
}
```

That's the whole implementation. No other file should change.

---

## 3. Pitfalls — read before coding

1. **`listProgramsForTenant` returns the FULL record, not a subset.** Its serializer
   spreads the whole Prisma row (including `active: false` programs, `defaultCoachId`,
   `color`, `icon`, `branchId`, `tenantId`). If the handler returns the service result
   directly, every member with the app sees inactive/internal data. The
   `.filter(active)` + explicit field `.map(...)` in the handler is **required**, not
   optional polish. Do not "simplify" it away, and do not let an AI assistant do so
   either.
2. **Don't modify the services.** `listProgramsForTenant` and
   `listMembershipPlansForTenant` are used by the staff web app; changing their
   filtering or shape would silently change staff screens. All member-facing
   filtering lives in the `MeController` handlers.
3. **Branch scoping comes from the session, not a query param.** Pass
   `session.homeBranchId` — never accept a `branchId` from the request; a member must
   not be able to browse another branch's catalog by editing the URL.
4. **Price fields are already numbers.** Both serializers convert Prisma `Decimal` via
   `toNumber()` — don't re-convert or you'll get `NaN`s.

---

## 4. Tests (required — the e2e suite is our regression gate)

Add one `it(...)` block (or two) to `apps/api/test/app.e2e-spec.ts`. Copy the member
sign-in pattern from the existing test `"member app sign-in works by phone only…"`
(around line 401): staff signs in as `owner@sparkgym.local` / `owner123`, sets a phone
and PIN on `member-001`, then `POST /api/member-auth/sign-in` with phone + PIN returns
the bearer token.

Useful seed facts (see `apps/api/src/data/operations-seed.ts`):

- `member-001` (Lina Ahmad) → tenant `tenant-spark-gym`, home branch `Platinum Fitness`.
- Seeded plans: `plan-monthly-flex`, `plan-ramallah-standard` (spark gym) and
  `plan-other-monthly` (**belongs to `tenant-other-gym`**).
- The seed contains **no training programs** — create them in the test via the staff
  API: `POST /api/training-programs` with the staff cookie.

Cover at least:

1. **401 without a token** for both `GET /api/me/courses` and `GET /api/me/plans`.
2. **Courses filtering.** As staff, create three programs:
   - A: `{ name: 'Yoga', active: true }` (no branchId → tenant-global) — expected ✔
   - B: `{ name: 'Boxing', active: true, branchId: 'branch-nablus-north' }` (other
     branch) — expected ✘
   - C: `{ name: 'Old Course', active: false }` — expected ✘
   Then as member-001, `GET /api/me/courses` → exactly `[A]`, and assert the returned
   object has **exactly** the 7 contract keys (e.g.
   `expect(Object.keys(course).sort()).toEqual([...])`) so a future refactor can't
   silently start leaking fields.
3. **Plans tenant isolation.** As member-001, `GET /api/me/plans` → contains
   `plan-monthly-flex` and `plan-ramallah-standard`, does **not** contain
   `plan-other-monthly`.

Run from `apps/api/` (needs the local `gym-dev-*` containers running — Postgres on
5434, Redis on 6381, MinIO on 9102; ask Basel if your dev stack isn't set up):

```bash
pnpm test:e2e
```

The whole suite must stay green — 41 passing today, 42–43 after your additions. Any
pre-existing test that fails is a real regression you introduced, not flakiness.

---

## 5. Definition of done

- [ ] Only `member-auth.module.ts`, `me.controller.ts`, and `app.e2e-spec.ts` changed.
- [ ] `pnpm lint` and `pnpm build` clean in `apps/api`.
- [ ] Full e2e suite green, including the new cases.
- [ ] Work on a branch, open a PR to `main` — no direct pushes. Basel reviews, merges,
      and deploys (deployment is not your step).

## 6. Explicitly out of scope (v1)

- No `POST` / subscribe / register endpoint. The backend already has a real enrollment
  path (`registerMember` → capacity check, pricing, debt recompute) that a future
  `POST /api/me/courses/:id/register` should reuse — that's a separate task if we do it.
- **App-side suggestion, not backend work:** since "Subscribe" stores nothing on the
  server, consider labeling the button "I'm interested" / "Ask at front desk" so
  members don't believe they've actually signed up. Flag to Basel if changing the label
  is hard.
