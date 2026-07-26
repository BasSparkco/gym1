# Spark Gym ERP Status Log

This file is the daily progress log for the project.
Add the newest update at the top so the latest status is always visible first.

---

## 2026-07-26 (Phase 2 Backend — Announcements, Closed Dates, Push Device Tokens)

Completed

* **Trigger**: with the mobile-app backend contract (`/me/memberships`) shipped earlier today, the owner asked to start Phase 2 of `gym_mobile_roadmap.md` — Announcements, Closed Dates, and push notifications. Entered plan mode first given the scope (new schema, a design decision on how push should relate to the existing per-member `Notification` pipeline, and a Firebase-credentials gap); plan approved before writing code.
* **Schema** (migration `20260726084628_add_announcements_closed_dates_device_tokens`): three new models. `Announcement` and `ClosedDate` both use the same optional-branch pattern as `TrainingProgram` (`branchId String?`, null = tenant-wide). `MemberDeviceToken` (FCM token per member device, unique on `(memberId, token)` so re-registering a device is an upsert not a duplicate).
* **Design decision**: Announcements deliberately do **not** reuse the existing `Notification`/`NotificationDispatchService`/`TenantSettings.notificationSettings` pipeline — that machinery exists to gate *automatic* per-event messages (membership expiring, etc.) behind per-tenant channel toggles, and there's nothing to gate for a manually-triggered broadcast. Creating an `Announcement` calls the delivery-provider layer directly (new `FcmNotificationProvider`, same pluggable-provider shape as `ConsoleNotificationProvider`/`SparkcoNotificationProvider`) and fans out to every matching `MemberDeviceToken`, caching `pushSentCount`/`pushFailedCount` on the announcement itself rather than creating a `Notification` row per recipient. The Prisma `NotificationChannel` enum (which backs the `Notification` table) was left untouched — only the TS-level provider-interface union in `data/operations-seed.ts` gained `'push'`.
* **No real Firebase project exists**, so `FcmNotificationProvider` is a console/log stand-in exactly like `ConsoleNotificationProvider` was for SMS/WhatsApp/email before real credentials existed — it logs `[push] -> <token>: ...` and reports success. Swapping in a real `firebase-admin` call later is a same-file follow-up once the owner sets up a Firebase project, not a redesign.
* **New backend modules**: `apps/api/src/modules/announcements/` and `apps/api/src/modules/closed-dates/`, following the exact Lockers-module convention (manual cookie-session auth, `requireRole` for writes, `DataScopeService` for branch-scoped list reads, no guards/decorators). Staff routes: `GET/POST /announcements`, `DELETE /announcements/:id` (owner/manager); `GET/POST /closed-dates`, `DELETE /closed-dates/:id` (owner/manager).
* **Mobile-facing reads** added to the existing `MeController` (bearer-token, same pattern as last session's `/me/memberships`): `GET /me/announcements`, `GET /me/closed-dates` (both tenant-wide + the member's own branch), `POST /me/device-token` (upserts the member's FCM token, called by `MembersService.upsertDeviceToken`, same shape as the existing `setMemberAppPin`). `MemberSession` gained a `homeBranchId` field so these can branch-scope without an extra DB round trip.
* **Staff frontend**: `/app/announcements` (feed-style list + delete, "Sent to N device(s)" indicator) and `/app/closed-dates` (table + delete), each with a `new` create page, mirroring the Lockers pages' structure exactly (`PageHeader`/`Card`/`Badge`/`Button`/`EmptyState`, server-action forms, owner/manager page-level role gating). Nav entries added next to Lockers. Full `en`/`ar`/`he` i18n.
* **Verified before calling it done**: `tsc --noEmit` clean on both apps, production `next build` clean. Full curl round-trip against local dev Postgres: staff create/list/delete for both features, unauthenticated 401s, member sign-in → register a device token → staff creates a new announcement → confirmed `pushSentCount` incremented and the console provider actually logged the push → member `GET /me/announcements`/`GET /me/closed-dates` returned correct branch-scoped data.
* **Browser-verified the new staff pages** (Playwright against a local `next build`/standalone server + local dev API): both list pages, both create-form pages, and Arabic/RTL rendering all confirmed correct via screenshots — no raw i18n keys, sidebar correctly mirrored, nav labels translated. **Hit a known class of issue while doing this**: driving the create forms' actual submit button through Playwright produced a stuck client-side redirect (form POST returns a real 303 but the browser never navigates and the row is never actually created) — reproduced identically on a completely unrelated, pre-existing, unmodified page (`/app/membership-plans/new`), confirming it's the same Next.js-standalone-server-plus-Playwright quirk already documented in the 2026-07-23 Lockers session, not a bug in this feature. Verification was done by seeding/cleaning data directly via the API instead (already proven correct via the curl round-trip above) and using the browser purely to confirm rendering.
* **`gym_mobile_roadmap.md` updated**: Backend Changes Needed table, API Reference, Phase 2 section, and Screens 4/5 all marked done; new "Push Notifications — Current State" section explains exactly what's real (storage, model, fan-out plumbing) vs. stand-in (actual delivery) and what's needed to flip it on.

Next

* **Not deployed to production yet** — this entry covers local-dev-verified work only. Deploying needs a fresh backup, an additive migration (`prisma migrate deploy`, no drops), and an API rebuild/redeploy, same discipline as every prior feature — pending explicit go-ahead.
* Phase 1 (Android): no backend blockers remain. Phase 2 backend is now also unblocked — an Android developer can build Announcements/Closed Dates/push-token-registration against the live contract once this is deployed.
* Real FCM push delivery still needs a Firebase project from the owner before `FcmNotificationProvider` can be upgraded from its log-only stand-in.
* Still undecided (ops decision, not code): how staff hand a member their PIN in real life.

---

## 2026-07-26 (Mobile Roadmap — GET /me/memberships Shipped, Getting-Started Test Account)

Completed

* **Trigger**: reviewing `gym_mobile_roadmap.md` against ROADMAP.md/status.md raised the question of whether that file alone is enough to hand to an external Android developer, or whether he'd also need repo access. Answer: the file is meant to be self-sufficient (base URL + endpoint contracts + stack), but it had two real gaps — the Home screen's membership card had no endpoint to read from (`GET /me/memberships` was listed as "New — not started"), and there were no working credentials for a developer with no repo/DB access to actually try the API.
* **`GET /api/me/memberships` added** (`apps/api/src/modules/member-auth/me.controller.ts`) — thin wrapper around the existing `MembershipsService.listMembershipsForMember(tenantId, memberId)` (already used by the staff-facing member profile page), scoped to the bearer-token session instead of a staff session. `MembershipsModule` added to `MemberAuthModule`'s imports; no schema/migration changes, no circular-import issues (`MembershipsModule`'s own imports — `AccessModule`/`AuthModule`/`NotificationsModule`/`DataScopeModule`/`DebtModule` — don't reach back into `MemberAuthModule`). Returns plan name/price/duration alongside status/dates/finalPrice, everything the Home screen needs.
* **Verified before deploying**: `tsc --noEmit` clean. Hit the known local-dev `nest start --watch` first-run race (documented previously) — worked around it the same way as before, one-shot `nest build` + running `dist/main.js` directly. Full flow confirmed against local dev Postgres: set a PIN on a seeded member via the staff endpoint, signed in as that member, confirmed `/me/memberships` returned the correct plan/price/dates, and confirmed the route still 401s with no token.
* **Deployed to production** (2026-07-25 ~22:22 UTC): backup first (`gym_db_20260726_001920.sql.gz` + MinIO archive), `docker compose -p gym -f docker-compose.prod.yml build api`, `up -d --no-deps api` (code-only change, no migration). Confirmed live: boot log shows `Mapped {/api/me/memberships, GET} route`, `GET https://gym.sparkco.vip/api` → 200, unauthenticated `GET /api/me/memberships` → 401 (not 404).
* **Created a dedicated test member for external developers** since there's no staging environment — `MEM-0013`, `fullName: "ZZZ TEST - Mobile API Developer Account"` (deliberately unmistakable as a fixture in any staff screen/report), one active membership (monthly plan) so `/me/memberships` has real data, PIN `246800`. Verified the full flow end-to-end against the live production API with these exact credentials: sign-in → `/me` → `/me/memberships` → `/me/qrcode`, all correct.
* **`gym_mobile_roadmap.md` updated**: new "Getting Started" section up top with the test credentials and working `curl` examples so an external Android developer needs nothing beyond that file to start Phase 1; `GET /me/memberships` marked done in the "Backend Changes Needed" table and "API Reference" section; Phase 0/Phase 1 sections updated to drop it as an open item.

Next

* Phase 1 (Android): sign-in screen, Home screen, QR code screen — see `gym_mobile_roadmap.md`. No further backend blockers for Phase 1.
* Phase 2 still needs real backend work before an Android dev can build against it: `Announcement` model + endpoints, `ClosedDate` model + endpoints, FCM device-token storage + `push` notification channel — none of these exist yet.
* Still undecided (flagged in the roadmap doc, needs an ops decision, not a code change): how staff actually hand a member their PIN in real life (front desk verbally? printed on a card? SMS?).

---

## 2026-07-25 (Report — Member Debt Is Ready)

**Status: ready and live in production.** This is the direct follow-up to `temp.md`'s note ("I want you work on members Debts... the owner wants to collect his money so debts is important").

What's ready now:

* Every member has a real, correct **debt** figure — no longer the placeholder `0` that was on the Members list before. It's the total of everything they've been charged across memberships, courses, and lockers, minus everything they've actually paid.
* The Members list "Debt" column shows it for every member at a glance (highlighted red when they owe something).
* The member's own profile page shows it as a badge next to their payment history.
* The "Record Payment" screen shows the member's current debt right at the top, so staff know how much is outstanding *before* they take a payment.
* It updates automatically the moment anything changes — a new membership, course registration, locker rental, or payment — there's nothing for staff to manually recalculate.
* Already backfilled and verified against the real production data: 12 real members checked, 7 currently carry a real balance (from ₪30 up to ₪230), the rest correctly show ₪0.

What's **not** built yet (from the same `temp.md` note, a separate follow-up if wanted):

* Sending a WhatsApp/email message to a member when they have a debt.
* Alerting staff automatically when a member with a debt checks in at the gate.

Full engineering write-up (schema, how it's computed, deployment steps) is in the entry directly below.

---

## 2026-07-25 (Member Debt — Real Balance Tracking Across Memberships, Courses, and Lockers)

Completed

* **Trigger**: with memberships, courses, and lockers all now separately chargeable (see the Courses entry below and the earlier Lockers entry), the owner asked for a real member "debt" figure — the Members list "Debt" column had only ever been a hardcoded `0` placeholder, never computed.
* **Design decision (with owner)**: no new ledger table. Debt is computed straight from the existing charge records — `Membership.finalPrice` (excluding `draft`/`cancelled`), `LockerRental.finalPrice` (excluding `cancelled`), `ProgramEnrollment.finalPrice` (excluding `cancelled`) — minus every `Payment.amount` with `status: 'paid'` for that member, regardless of which membership the payment happened to be recorded against (matches how staff actually use the Payments form today — an amount received from the member, not earmarked to one specific charge). The result is cached on a new `Member.debt` column rather than computed live on every list-page read.
* **New `DebtModule`/`DebtService`** (`apps/api/src/modules/debt/`): a small, dependency-free module (only depends on `PrismaService`, which is `@Global()`) so it could be imported into `MembershipsModule`, `LockersModule`, `TrainingProgramsModule`, `PaymentsModule`, and `MembersModule` without any circular-import risk. Exports a pure `computeMemberDebt(prisma, memberId)` function (reused identically by both the live service and the one-time backfill script, so the two can never drift) plus `DebtService.recompute`/`recomputeForTenant`.
* **Recompute hooked into every mutation that changes what a member owes or has paid**: `MembershipsService.createMembership`/`updateMembership`/`renewMembership`, `LockersService.createRental`/`cancelRental`, `TrainingProgramsService.registerMember`/`unregisterMember`, `PaymentsService.createPayment`. The cache is never hand-maintained — it's always freshly recomputed right after the write that could have changed it.
* **New `GET /members/:memberId/debt`** endpoint — recomputes live rather than trusting the cache, used specifically on the "Record Payment" page so the figure shown at the moment staff are about to take money is guaranteed fresh even in an edge case where the cache drifted.
* **Migration** (`20260724222447_add_member_debt`): `Member.debt Decimal @default(0)`. Since existing members' real debt isn't 0, a one-time backfill script (`apps/api/src/scripts/backfill-member-debt.ts`, follows the existing `backfill-user-employee-links.ts` pattern — standalone `PrismaClient`, not Nest DI) recomputes every member's debt from their real history.
* **Frontend**: Members list "Debt" column now renders the real cached figure (red when > 0); the "Record Payment" page shows a "Current debt" banner (live-recomputed); the member profile page's Payments section header shows a "Debt" badge. Reused the existing `t.members.debt` i18n key where it already fit; added one new key (`payments.currentDebt`) across en/ar/he.
* **Verified before deploying**: `tsc --noEmit` clean on both apps. Walked it end-to-end against local dev Postgres: seed data produced real non-zero debt figures matching the underlying memberships/payments by hand-check (e.g. a member with a `finalPrice: 150` membership and only a `pending` payment showed `debt: 150`); recording a new `paid` payment for that exact amount dropped their debt to `0` immediately; both the Members list and Record Payment page rendered the correct numbers.
* **Deployed to production** (2026-07-25 ~00:36 UTC): fresh backup (`gym_db_20260725_003621.sql.gz` + MinIO archive), `docker compose -p gym -f docker-compose.prod.yml build api web` clean, `up -d --no-deps api web` (migration auto-applied via the API's boot command), then `docker exec gym-api-1 node dist/scripts/backfill-member-debt.js` run once against the real database — **12 real members recomputed, 7 with a non-zero balance** (spot-checked via `psql`: highest real balance ₪230, several at ₪150/₪110/₪30, the rest correctly ₪0). `GET /api` → 200, `GET /api/members/x/debt` → 401 (route live, auth required), `GET /app/members` → 307. Both containers healthy.

Next

* No further action needed for this feature — it's live and backfilled. If the owner ever wants payments earmarked to a *specific* charge (rather than reducing overall debt generically), or wants locker/course payments recorded through their own dedicated flows instead of the general Payments form, that's a bigger change than what was asked for here.

Notes

* **Policy call made on the owner's behalf, not explicitly specified**: a `cancelled` membership/rental/enrollment is treated as a voided charge (excluded from "owed" entirely) rather than a debt that still needs collecting. A `draft` membership (not yet started) is excluded the same way. If the real business rule is "the member still owes even if they cancel," this needs revisiting — it's a one-line change to `computeMemberDebt`'s `where` filters in `apps/api/src/modules/debt/debt.service.ts`, not a schema change.
* **Important for future work, recorded in memory**: `DebtService` has no live-computed fallback anywhere except the one `GET /members/:id/debt` route used by the Record Payment page — everywhere else (the Members list, the profile page) trusts the cached `Member.debt` column. Any *new* chargeable feature added later (another `finalPrice`-bearing model) must (1) add it to `computeMemberDebt`'s owed-side query and (2) call `debtService.recompute()` after every create/cancel mutation on it, or the cache will silently go stale for that feature's charges. See `[[project_member_debt]]` memory.
* This is the first time real financial totals (as opposed to per-record prices) have been computed and displayed anywhere in the app — worth an extra sanity pass from the owner against a few known members' real-world balances before fully trusting the numbers for collections.

---

## 2026-07-24 (Courses Feature — Priced, Membership-Independent Classes with Attendance Reporting)

Completed

* **Trigger**: gym owner observation from a real walkthrough — classes/courses aren't part of membership at all. A course is a standalone paid offering with its own start/end date and weekly schedule; any member can register regardless of membership plan, the cost is owed independently, students ("students") check in at every lesson, and the gym needs an end-of-course presence/absence report.
* **Found the existing "Training Programs/Class Sessions/Bookings" system was built for a different model** — booking required an active membership (`ClassBookingsService.bookClass` → `activeMembershipFor` + `MembershipPlanProgram` entitlement), and classes had no price or term dates. Rather than bolt on a second parallel system, extended the existing models after aligning with the owner on scope: no new debt ledger (course price stored on the enrollment record only — same pattern `LockerRental.finalPrice`/`Membership.finalPrice` already use, no auto-created `Payment` row), multiple weekly day+time slots per course (not one repeating slot), staff-marked attendance as the primary check-in path (the existing gate-check-in auto-attendance match in `visits.service.ts` needed no changes and keeps working as a bonus path).
* **Schema** (migration `20260724212402_add_courses`): `TrainingProgram` gained `price`/`startDate`/`endDate`; new `ProgramScheduleSlot` model (`dayOfWeek` + `startTime`/`endTime`, `@db.Time`); `ProgramEnrollment` gained `finalPrice` (price snapshot at registration) and `status` (`active`/`cancelled`); `ClassBooking.membershipId` is now nullable.
* **Behavior change — booking is enrollment-gated, not membership-gated**: `ClassBookingsService.bookClass` now checks for an active `ProgramEnrollment` in the session's program instead of membership status/plan entitlement. `TrainingProgramsService.registerMember` auto-books the member into every upcoming scheduled session of the course on registration (respecting each session's capacity, waitlisting if full); `unregisterMember` cancels the member's future bookings but preserves past attended/no-show history so the attendance report stays accurate.
* **New backend surface**: schedule-slot CRUD (`GET/PATCH .../schedule`), `generateSessions` (expands the weekly slots across the course's date range into `ClassSession` rows, reusing `ClassSessionsService.createSession` rather than duplicating its validation, idempotent on re-run), `registerMember`/`unregisterMember`/`listEnrollments`/`listEnrollmentsForMember`, `getAttendanceReport` (per-student presence/absence across every lesson). `ClassBookingsService` gained `markAttendance` for staff-driven check-in.
* **Frontend**: price/start/end-date fields on the course create/edit form; the program detail page's old bulk "set enrolled members" `MemberChecklist` was replaced with a real roster (register/unregister individual students, showing each one's charged price) — the now-unused `MemberChecklist` component was deleted rather than left as dead code; new `/schedule` sub-page (weekly slot editor + "generate sessions" action) and `/report` sub-page (attendance table); "Mark present"/"Mark absent" buttons on the session detail page; new member-side `/app/members/[memberId]/courses/new` registration flow mirroring the existing Lockers sell flow; a new "Courses" section on the member profile view next to Lockers. Retitled the feature's user-facing copy from "Classes"/"Training Programs" to "Courses" across en/ar/he (route paths and module names deliberately left as `training-programs` to limit churn).
* **Verified before calling it done**: `tsc --noEmit` clean on both apps, `nest build` clean. The standalone dev infra containers (`gym-dev-postgres`/`redis`/`minio`) had been torn down since they were last documented as running — recreated all three, ran `prisma migrate deploy` + `generate`, reseeded. Walked the full golden path directly against the API: created a course with a price/date range → set a 2-slot weekly schedule → generated 5 sessions correctly split across the two weekdays → registered a member **with no active membership** (confirming membership is no longer required) → member auto-booked into all 5 sessions → marked one attended via the new endpoint → attendance report correctly showed 1 attended/4 pending → unregistering cancelled the 4 future bookings while preserving the attended one's history. Also confirmed directly booking an unregistered member into a session is correctly rejected. Fetched every new/changed page (course list, detail/roster, schedule, report, session, member profile, member course-registration) through the actual rendered web app and confirmed correct content in both languages.
* **Found and worked around a local-dev-environment issue, not a bug in this feature**: several stale orphaned `nest start --watch` processes from past sessions were still running, all bound to this project's `dist/` output with `deleteOutDir: true` — they were fighting each other over the same folder, producing spurious "Cannot find module dist/main" errors on every fresh `pnpm dev:api`. Cleared the stale ones out (each verified via `readlink /proc/<pid>/cwd` before killing) and, for this session's verification, sidestepped the watcher's inherent first-run race entirely by running a one-shot `nest build` and executing the compiled output directly rather than fighting `--watch` mode.
* **Deployed to production** (2026-07-24 ~21:58 UTC): fresh backup first (`scripts/backup.sh` → `gym_db_20260724_235717.sql.gz` + MinIO archive), both images built clean via `docker compose -p gym -f docker-compose.prod.yml build api web` (web's route manifest confirmed all new pages compiled: `/app/training-programs/[programId]/schedule`, `/report`, `/app/members/[memberId]/courses/new`), then `up -d --no-deps api web` — the API's existing `prisma migrate deploy && node dist/main` boot command applied `20260724212402_add_courses` automatically. **Verified live**: boot log shows the migration applying and all new `/api/training-programs/*`/`/api/class-bookings/*/attendance` routes mapped; `\d` confirms `ProgramScheduleSlot` table, `TrainingProgram.price/startDate/endDate` columns, and `ClassBooking.membershipId` now nullable with `ON DELETE SET NULL` all present in the real production database. `GET https://gym.sparkco.vip/api` → 200, `GET /` and `GET /app/training-programs` → 307 to sign-in (expected, unauthenticated), `GET /api/training-programs` and `GET /api/training-programs/x/attendance-report` → 401 (routes live, auth required, not 404). Both containers healthy.

Next

* **Known, deliberate leftover**: `MembershipPlanProgram`/`allowAllPrograms` schema and the membership-plan "entitled programs" picker UI still exist but are no longer consulted by booking eligibility — left in place since removing them is a separate, unrequested change. Flag to the owner if it's ever confusing in the UI.
* Same open question already flagged for Lockers: should course revenue eventually feed into the Payments ledger/reports, or stay a standalone `finalPrice` record as it is now?
* No real owner sign-in or live data creation was performed against production beyond the health/route checks above, deliberately, to avoid writing test data into the real tenant — first real use should be the owner creating an actual course.

---

## 2026-07-23 (Lockers Follow-up — Deduplicated Member Profile Rendering)

Completed

* **Bug reported**: "Sell locker" didn't appear anywhere reachable from the Members list page. Root cause: the members list (`apps/web/src/components/members/members-table-body.tsx`, added in today's earlier `242eaee` refactor) has its own inline row-expansion view with a hand-duplicated copy of the member profile JSX (`ProfilePanel`) — a second, independent implementation from the dedicated `/app/members/[memberId]` page. The Lockers section (added earlier this session) had only been added to the dedicated page, never to this duplicate, so anyone using the list's inline expand (the more common path — clicking a member row, vs. the "Edit" button which opens a *different* inline edit form with no sell/pay actions at all, by design) never saw it.
* **Fixed by de-duplicating, not patching around it** — extracted the entire profile view into one shared component, `apps/web/src/components/members/member-profile-view.tsx` (`MemberProfileView`, plus the `MembershipRow`/`PaymentRow`/`LockerRentalRow`/`MemberProfileData` types), accepting either `editHref` (dedicated page: navigates) or `onEditClick` (inline list: toggles the panel in place). Both call sites — `members-table-body.tsx`'s inline expansion and `/app/members/[memberId]/page.tsx` — now render through this single component, so a future addition (or the next section anyone adds) only needs to happen once.
* `apps/web/src/app/app/members/page.tsx` now also fetches `listLockerRentalsForMember` per page of members (same N+1-per-page pattern already used for payments) so the inline view has rental data to render.
* Fixed a lint issue surfaced during the refactor (`react-hooks/static-components`): the edit-button-or-link helper was being defined as a component *inside* `MemberProfileView`'s render body — moved it to module scope taking `editHref`/`onEditClick` as explicit props.
* Verified: `tsc --noEmit` clean, production `next build` clean, and confirmed live in the browser both on local dev and after deploying — Members list → click a member row (not Edit) → Lockers section with a working "Sell locker" link now shows up, same as the dedicated profile page.
* **Deployed to production**: backup taken first, only `web` rebuilt/redeployed (no API changes this round), verified live via Playwright against `gym.sparkco.vip` with a real sign-in.

Next

* No other known duplication between the members-list inline view and the dedicated profile page — worth keeping in mind if the *employees* or *users* list pages (refactored in the same `242eaee` commit) have a similar inline/dedicated split before adding sections to either one.

---

## 2026-07-23 (Lockers Module — Built and Deployed to Production)

Completed

* **Trigger**: gym owner asked about lockers during a demo. ROADMAP.md Phase 2 already listed "Lockers" (`Locker rental`, `Rental tracking`) but it had never been designed or built — this session designed the data model from scratch and shipped it end-to-end, including the specific UI placement requested: a "Lockers → Sell locker" section on the member profile page, positioned between Memberships and Payments.
* **Schema** (`apps/api/prisma/schema.prisma`, migration `20260723192121_add_lockers`): two new models.
  * `Locker` — the physical unit (tenant/branch-scoped, unique `lockerNumber` per branch, optional `size` small/medium/large, `monthlyPrice`, `status` available/occupied/maintenance). Modeled as a limited physical resource with its own occupancy state, not an unlimited template like `MembershipPlan`.
  * `LockerRental` — assignment of a `Locker` to a `Member` (`startDate`/`endDate`/`status` active/expired/cancelled/`finalPrice`). One active rental enforced per member and per locker, mirroring the existing `Membership` one-active-per-member rule. Auto-expiry of stale rentals on read, same pattern as `MembershipsService.autoExpireStaleForTenant`.
  * Deliberately **not** wired into the `Payment` table/ledger — `Payment.membershipId` is required NOT NULL with `onDelete: Restrict`, and loosening that to support two owner types was more invasive than what was asked. `LockerRental.finalPrice` stands alone for now; folding locker revenue into the Payments report is a natural follow-up if the owner wants it.
* **Backend**: new `apps/api/src/modules/lockers/` module (controller/service/module, registered in `app.module.ts`). Routes: catalog CRUD (`GET/POST /lockers`, `GET/PATCH/DELETE /lockers/:lockerId`, owner/manager for writes, owner-only delete) and rentals (`GET /lockers/rentals/member/:memberId`, `POST /lockers/rentals`, `POST /lockers/rentals/:rentalId/cancel`).
* **Bug found and fixed during manual verification**: deleting a locker with any rental history (even cancelled/expired) threw an unhandled Prisma FK-restrict violation as a raw 500. Fixed by checking for rental history explicitly and returning a clean 400 ("set it to maintenance instead").
* **Frontend**: `/app/lockers` catalog (list/new/detail, owner+manager, bulk "create N sequential lockers" for onboarding a whole bank at once) + nav entry next to Membership Plans; `/app/members/[memberId]/lockers/new` sell-locker flow; new "Lockers" section on the member profile page in the exact requested position. Full en/ar/he i18n.
* **Verified thoroughly before deploying**: `tsc --noEmit` clean on both apps, production `next build` clean, full API round-trip against local dev Postgres (create locker → rent it → double-booking correctly rejected → same-member second rental correctly rejected → cancel correctly frees the locker → delete-with-history correctly blocked after the fix), and browser screenshots of the rendered pages (catalog list, sell-locker form, member profile section ordering) in both English and Arabic/RTL.
* **One local-dev-environment red herring, not a bug in this feature**: driving the "sell locker"/"new locker" forms through Playwright in the ad-hoc `next dev` setup produced a stuck redirect (server action response pointed back at the current page). Reproduced identically on an untouched, pre-existing page (`/app/membership-plans/new`), confirming it's a Next-canary/Turbopack dev-server quirk, not something introduced here. Verification was done via direct API calls instead; recorded in memory for future sessions so it isn't re-chased as an app bug.
* **Deployed to production** (2026-07-23 ~22:03 UTC): fresh backup first (`scripts/backup.sh` → `gym_db_20260723_220304.sql.gz` + MinIO archive), built both images (`docker compose -p gym -f docker-compose.prod.yml build api web`), recreated both containers (`up -d --no-deps api web`) — the API's existing `prisma migrate deploy && node dist/main` boot command applied the new migration automatically. **Verified live**: `Locker`/`LockerRental` tables confirmed via `psql \dt`, boot log shows all new `/api/lockers*` routes mapped, `GET https://gym.sparkco.vip/api` → 200, `GET /` → 307 to sign-in, `GET /api/lockers` → 401 (route live, auth required, as expected).

Next

* Ask the owner whether locker rental payments should appear in the same Payments ledger/reports as membership payments, or stay separate as they are now.
* Consider a renew/extend action for `LockerRental` (currently: sell a new rental after the old one expires/cancels — no in-place extension yet), same shape as `Membership`'s renew flow.

---

## 2026-07-23 (Status/Roadmap Refresh + Deploy Verification — Catching Up on Jul 10-23 Work)

Completed

* **status.md and ROADMAP.md had gone stale since 2026-07-10** — five commits landed in that window without either doc being updated. This entry catches both files up; no code changed this session beyond the docs themselves.
* Reviewed and summarized the five undocumented commits:
  * `e0f1fa7` (Jul 10) — every `User` account now requires a 1:1 link to an `Employee` record; account creation moved to the Users page via a searchable employee combobox; backend enforces the unique FK and keeps `Employee.isUser` in sync; one-time backfill script for pre-existing accounts.
  * `c1e7191` (Jul 15) — demo feedback pass: `TenantSettings.logoMode` + `Branch.logoUrl` (MinIO-backed) for branch/tenant logos, member profile page rebuilt to match the supplied mockup (pine/mist/volt design language, computed age/BMI, membership days-left meter), RTL phone-number bidi fix via a reusable `PhoneNumber` component, new shared `ui/` primitives (button, card, badge, stat-card, empty-state, page-header).
  * `806b8e2` (Jul 21) — member-facing auth backend: staff assign a PIN via `POST /members/:id/pin`, members sign in via `/member-auth/sign-in` (phone/member-number + PIN) and get a Redis-backed revocable bearer token, `/me` and `/me/qrcode` expose profile/QR data scoped to that token. This is Phase 0 of the mobile app per `gym_mobile_roadmap.md`. Also fixed `pinHash` leaking through existing member read endpoints.
  * `a5c874e` (Jul 21) — broad UI pass ("new start mobile") across dashboard, branches, members, employees, membership-plans, training-programs, sign-in, and the app shell.
  * `242eaee` (Jul 23, today) — refactored employees/members/users list pages into new shared components (`member-profile-shared.ts`, `members-table-body.tsx`, `employee-list.tsx`, `user-list.tsx`) and server actions.
* **Investigated an apparent production deployment lag, then corrected the finding**: initial image-timestamp-vs-commit-timestamp comparison suggested `gym-api-1` predated `806b8e2` and `gym-web-1` predated `242eaee`. Ran `docker compose -p gym -f docker-compose.prod.yml build api web` (fresh pre-deploy backup taken first via `scripts/backup.sh`) — both builds came back fully cache-hit with image IDs **identical** to what was already running. Root cause of the false alarm: both commits were built from a working tree that already had the changes staged/uncommitted (the exact files `git status` showed as modified/untracked at the start of this session) before they were later committed — same content, later commit timestamp, so BuildKit's content-hash cache correctly recognized no change. `docker compose ... up -d --no-deps api web` confirmed no container recreation was needed. **Verified live**: `GET /api` → 200, `POST /api/member-auth/sign-in` → 401 (route registered, not 404 — member-auth backend confirmed live), `GET /` → 307 to sign-in. Production is current with `HEAD` (`242eaee`); no redeploy was actually required, but one was run end-to-end to confirm.
* **ROADMAP.md "Current Status Snapshot" rewritten** — it previously still said Phase 0/1 "In Progress"/"Started" and Phase 2+ "Not Started" with RFID as next focus, which had been inaccurate since at least the 2026-07-09/10 Training Programs work. Now reflects: Phase 0-1 done, Phase 2 (Training Programs/Classes/Coaches) mostly built, Phase 4 delivered via QR + BAS-IP instead of RFID (RFID/fingerprint/face recognition deliberately not pursued — this customer's hardware uses QR), Phase 5 (mobile) backend groundwork started but undeployed.
* **Confirmed via grep**: no Push notification channel exists anywhere in the codebase (SMS/WhatsApp/Email only) — the one MVP-scope gap left from the README's original notification list. Employee-specific attendance tracking (distinct from member visit tracking) also doesn't exist.

Next

* Start the actual mobile client (Android/Flutter) against the now-ready and now-verified-live `/member-auth` + `/me` API contract — see `gym_mobile_roadmap.md`.
* Build Push notification delivery — the one unbuilt item from the original MVP notification list (SMS/WhatsApp/Email are live).
* Keep status.md/ROADMAP.md updated per-session going forward rather than letting them drift again.

---

## 2026-07-10 (Project Review — Security Hardening, Ops, Green Test Suite, Plan-Program UI)

Completed

* **Full project review** (ROADMAP.md + status.md + code + prod config + live containers) with everything below implemented, tested, and committed (`7aea4be`). Deliberately excluded the in-progress User–Employee-link work sitting uncommitted in the tree (schema, migration `20260710000000_link_user_to_employee`, employees/users controllers+pages, `employee-combobox.tsx`) — that remains for separate review/commit, including staging only this session's hunks of the shared `lib/i18n.ts`.
* **Security — `Secure` cookie flag was silently off in production**: `auth.controller.ts` sets `secure: NODE_ENV === 'production'` but nothing ever set `NODE_ENV` (confirmed via `docker exec gym-api-1 printenv`). Fixed by adding `NODE_ENV: production` to the prod compose api service.
* **Security — reports API had no role checks**: every `/api/reports/*` endpoint (including the new revenue-bearing payments/plan-performance reports) only required *a* session; a front-desk user could read revenue by URL. Now owner/manager-only except `dashboard-summary` (used by all roles), plus a server-side role gate (`/app/reports/layout.tsx`) covering all 12 report pages. Verified live: front-desk → 403 on API, 307 → dashboard on web; owner → 200.
* **Security — sign-in brute-force throttling**: `POST /auth/sign-in` now rate-limited (10/min per client IP, `@nestjs/throttler` scoped to the auth module; `trust proxy` set in `main.ts` so `req.ip` is the real client behind Traefik). Verified live: 429 after the limit.
* **Ops — automated backups**: new `scripts/backup.sh` (nightly `pg_dump` + MinIO archive into `backups/auto/`, 14-day rotation), test-run verified (valid dump, 20 tables). **Cron entry not yet installed** (blocked by session permissions): `(crontab -l; echo '30 3 * * * /opt/sites/gym/scripts/backup.sh >> /var/log/gym-backup.log 2>&1') | crontab -`.
* **Test suite fully green for the first time — 40/40 e2e + 5/5 unit** (was 8 failing). Root causes were three distinct things, not just "date drift": (1) real date drift — seed memberships and several tests hardcoded absolute dates that real time passed; seeds and tests now compute dates relative to today (`addDays`/`localDateString`); (2) stale expectations — branch-scoped active-membership counts (5→4), `$`→`₪` after the currency feature, and derived member status (a new member with no membership is now correctly `inactive`); (3) the "flaky SparkCo network" test was actually nondeterministic `find()` over two per-channel notifications (whatsapp `sent` / email legitimately `failed` with no address on file) — now asserts on the whatsapp attempt specifically. Two reports tests also updated for the new role checks (front-desk 403 asserted, owner used for reads).
* **Phase 4 cleanup executed** (JSON-store burn-in complete): `operations-store.ts`/`settings-store.ts` reduced to types + seed defaults and renamed `operations-seed.ts`/`settings-seed.ts`; deleted all store file I/O, `migrate-json-to-postgres.ts`, `normalize-phones.js`, the committed `data/*.json` seeds, an accidentally-tracked stray `apps/api/apps/api/data/auth-store.json`, the `api-data` volume mounts (both compose files), and the e2e `API_DATA_ROOT` scaffolding. Settings channel defaults aligned with the old committed seed (whatsapp on for `membershipActivated`). The `gym_api-data` Docker volume itself is left on disk as a rollback archive.
* **Plan↔Program entitlement UI built** (closed the gap flagged 2026-07-09): membership plan edit form now has an All-programs / Selected-programs-only selector with a checkbox picker of active training programs (saves `allowAllPrograms` + `PATCH .../entitled-programs`); the plan detail page shows program access and flags a restricted plan with zero programs in red. Full en/ar/he i18n. Verified end-to-end on disposable dev servers (API 3200 / web 3300, same pattern as 2026-07-09): restricted a real plan to a program via the API, confirmed both pages render, reverted all test data.
* **Also fixed along the way**: stale `.tsbuildinfo` making `nest build` silently emit nothing (same class of bug as the 2026-06-24 Docker fix — deleted the local file).

Next

* **Production cutover pending — user action required** (blocked by session permissions): fresh backups taken (`backups/auto/gym_db_20260710_075942.sql.gz` + MinIO), new `gym-api`/`gym-web` images already **built from a clean worktree at `7aea4be`** (`/opt/sites/gym-deploy` — built from the commit, *not* the working tree, so the uncommitted User–Employee work is not baked in). To cut over: `cd /opt/sites/gym-deploy && docker compose -p gym -f docker-compose.prod.yml up -d --no-deps api web`, verify `https://gym.sparkco.vip/api` → 200 and the session cookie now carries `Secure`, then `git worktree remove /opt/sites/gym-deploy`. No DB migration in this commit.
* Install the backup cron entry (one-liner above) and consider copying `backups/auto/` off the VPS.
* `pnpm-lock.yaml` is gitignored — it should be committed (the Docker build needs it; the deploy worktree required a manual copy). Recommend removing it from `.gitignore` and committing it.
* ROADMAP.md "Current Status Snapshot" and "Current next focus" are stale (still say Phase 0/1 in progress and RFID as next focus) — worth a refresh pass.

---

## 2026-07-09 (Training Programs, Classes & Coaches — Design Finalized, Implementation Started)

Completed

* **Design review of `docs/Training Programs & Classes Design.md`** (an AI-brainstormed draft written after a legacy-app walkthrough with the gym owner) against the live Prisma schema. Key findings: the draft's Plan/Program/Class/Coach separation is sound, but it (1) proposed a duplicate `Coach` person entity instead of extending the existing `Employee` model, (2) put Member↔Program/Class relationships as fields on `Member` instead of normalized join tables, (3) explicitly said Membership Plans should never gate Training Programs — unrealistic once premium/add-on classes exist, (4) had no tenant/branch scoping despite every other model in the schema requiring it, (5) had no capacity/waitlist concurrency handling, and (6) no plan for recurring schedules beyond "future capability."
* **Design doc rewritten** to the finalized architecture: `TrainingProgram` (tenant/branch-scoped), `CoachProfile` (1:1 extension of `Employee`, mirrors the `TenantSettings`-on-`Tenant` pattern), `ClassSession` (template+instance split via `recurrenceId` for recurring schedules), `ClassBooking` (member enrollment/waitlist/attendance, transaction-safe capacity handling), and a `MembershipPlan.allowAllPrograms` + `MembershipPlanProgram` entitlement link (mirrors the existing `allowAllBranches` pattern). Attendance reuses the existing `Visit` model instead of a second tracking pipeline.
* **ROADMAP.md Phase 2 updated** with the concrete module breakdown reflecting this schema; status moved from "Not Started" to "Started."

* **Prisma schema + migration** (`20260709184045_add_training_programs_classes`): `TrainingProgram`, `CoachProfile` (1:1 on `Employee`), `ClassSession`, `ClassBooking`, `MembershipPlanProgram` (entitlement join), plus `MembershipPlan.allowAllPrograms` (default `true`, mirrors the existing `allowAllBranches`). All new models are tenant-scoped; `TrainingProgram.branchId` is nullable for tenant-global programs.
* **Three new backend modules** (`apps/api/src/modules/training-programs`, `class-sessions`, `class-bookings`), following the existing manual-auth/`requireRole`/`DataScopeService` conventions (no guards/decorators, matches `employees`/`memberships`):
  * `TrainingProgramsService` — CRUD plus `listEntitledProgramIds`/`setEntitledPrograms` for the Plan↔Program entitlement link.
  * `ClassSessionsService` — CRUD, coach/room double-booking conflict checks at creation time, `createRecurringSessions` (template+instance split via a shared `recurrenceId`, skips-and-reports individual occurrence conflicts rather than failing the whole batch), cascade-cancels bookings when a session is cancelled.
  * `ClassBookingsService` — `bookClass` validates active membership + plan entitlement + no overlapping booking, then inside a `$transaction` with a `SELECT ... FOR UPDATE` row lock on the session counts existing `booked` rows and atomically inserts as `booked` or `waitlisted` (closes the race the design doc flagged). `cancelBooking` promotes the oldest waitlisted booking, re-validating membership/entitlement at promotion time. An hourly `@Cron` sweep marks stale `booked` rows `noShow`.
  * `EmployeesService` extended with `listCoachesForTenant`/`getCoachProfile`/`upsertCoachProfile` — a coach is an `Employee` with a `CoachProfile` row, not a new entity.
  * `VisitsService.checkIn` now best-effort-matches a member's gate check-in to an open class booking (same branch, session time window) and marks it `attended` — reuses the existing `Visit`/`AccessMethod` pipeline instead of a second attendance system.
* **7 new e2e tests** added to `test/app.e2e-spec.ts` (all passing): program CRUD + invalid-branch rejection, coach profile upsert + coach listing, session scheduling + coach/time conflict rejection, booking + capacity waitlisting + waitlist promotion on cancel + duplicate-booking rejection, plan-entitlement rejection/approval, and recurring session generation. Confirmed the 5 pre-existing date-drift e2e failures (dashboard summary counts, membership status) are unchanged and present identically on `main` without this branch's changes.
* **Frontend**: new `lib/training-programs.ts`, `lib/class-sessions.ts`, `lib/class-bookings.ts` clients (same `authedFetch` pattern as `lib/employees.ts`); `lib/employees.ts` extended with coach-profile functions. New pages under `/app/training-programs` (list, new, detail+edit with an inline class-session list, per-session detail with a booking form and per-booking cancel), a Coach Profile section added to the existing employee detail page, and a `classes` nav entry (owner/manager/front-desk). Full `en`/`ar`/`he` i18n coverage added to `lib/i18n.ts`.
* **Found and fixed one bug during manual verification**: `ClassSessionsService`'s serializer was spreading Prisma's internal `_count` relation-count object straight into the API response instead of just using it to compute `bookedCount` — fixed to destructure it out before spreading.
* **Verified end-to-end against real (dev) Postgres data**, not just the e2e suite: booted a disposable API instance (port 3200, untouched live containers) and a disposable `next dev` web instance (port 3300) against the dev database, signed in as the seeded owner, and drove the full flow through the actual rendered pages — created a program, set a coach profile on a real employee, scheduled a class, booked a real member into it, and confirmed all of it rendered correctly (program list/detail, session detail with the booked member and status badge, coach profile fields) before cleaning up the test data (cancelled the session, deactivated the program) and tearing down both disposable servers. Confirmed `tsc --noEmit` and `next build` are clean on both apps.

* **Committed** (`952804e`, local only, not pushed) — 33 files, the schema/migration/backend/frontend/tests above, deliberately excluding unrelated pre-existing uncommitted work already sitting in the tree (reports module, currency doc, mobile-header) for the user to review/commit separately.
* **Deployed to production** (2026-07-09, ~22:45–20:53 UTC), following the same backup-first, verify-at-every-step discipline as the original Postgres cutover: backed up the live `gym` database (`backups/gym_db_pre-training-programs-migration_20260709_224534.sql.gz`, `pg_dump` via `docker exec gym-db-1`) before touching anything; built new `gym-api`/`gym-web` images without stopping the running containers; ran `prisma migrate deploy` against production as a one-off container on the `gym_internal` network (additive migration only — new tables/columns, no drops) and confirmed all 5 new tables (`TrainingProgram`, `CoachProfile`, `ClassSession`, `ClassBooking`, `MembershipPlanProgram`) exist via `psql \dt`; then recreated `gym-api-1`/`gym-web-1` with the new images. Verified live via the public domain: `GET https://gym.sparkco.vip/api` → 200, `GET /` → 307 to sign-in (expected, unauthenticated), `GET /api/training-programs` → 401 (expected, requires auth). Both containers healthy with all new routes mapped in the boot log.

Notes

* This is a new feature (Phase 2), distinct from the "Training Programs" entry under ROADMAP.md Phase 6 ("Fitness Features"), which refers to workout plans/exercise libraries/progress tracking, not scheduling — flagged in the design doc to avoid future confusion between the two.
* Not yet built (deliberately deferred, flagged in the design doc as a follow-up question for the client): guest/drop-in passes for non-members, and a UI for managing the `MembershipPlan.allowAllPrograms`/entitled-programs toggle from the Membership Plans pages (the API exists — `PATCH /training-programs/plans/:planId/entitled-programs` — but there's no frontend for it yet, only the backend + e2e coverage).
* No live-hardware or real-member smoke test was performed against production beyond the health/route checks above (no owner sign-in or data creation against the real tenant) — deliberately, to avoid writing test data into production. First real use should be a real owner creating a real training program.

---

## 2026-07-03 (Redis for Auth Sessions + MinIO for Member Photos)

Completed

* **Redis replaces Postgres for auth sessions.** New `RedisModule`/`RedisService` (`apps/api/src/redis/`, `ioredis`-based, mirrors `PrismaService`'s shape as a `@Global()` singleton). `AuthService` rewritten to store sessions in Redis as `session:<token>` → JSON `{userId, createdAt, expiresAt}` with a native Redis TTL (`EX`) instead of a Postgres `expiresAt` filter — removes the need for any scheduled cleanup job. The `Session` Prisma model and table were dropped (migration `20260703162247_drop_session_table`).
* **MinIO replaces local disk for member photos.** New `MinioModule`/`MinioService` (`apps/api/src/minio/`, official `minio` client, auto-creates its bucket on boot). `members.controller.ts`'s `uploadMemberPhoto` now calls `putObject` instead of writing to `.local/uploads/members`. New `MemberPhotosController` (`GET /api/uploads/members/:filename`) proxies photo reads out of MinIO at the exact same public URL members always used — zero frontend changes — and now requires a valid session (the old Express static-file serving had no auth check at all).
* **`main.ts` simplified** — removed `useStaticAssets`/`.local/uploads` bootstrap entirely now that nothing serves from local disk; switched back from `NestExpressApplication` to the plain Nest factory since nothing else needed Express-specific APIs.
* **Both `docker-compose.yml` and `docker-compose.prod.yml`** gained healthchecked `redis` and `minio` services (prod: `internal` network only, never `traefik-public` — MinIO is only ever reached through the API's proxy route). `REDIS_URL`/`MINIO_*` env vars added to the `api` service and to both `.env.example` files.
* **Test infra updated** for both: `resetPrismaTestData` now also `flushdb()`s a dedicated Redis DB index (`/1`) alongside its Postgres `TRUNCATE`; `jest-e2e-setup.ts` points `REDIS_URL`/`MINIO_*` at the same local dev containers used by `pnpm start:dev`, using a distinct MinIO test bucket (`member-photos-test`) so test uploads never mix with real dev photos. Added a new e2e test: upload a member photo → fetch it through the proxied route with a session (200, correct bytes) → fetch without one (401).
* **Found and fixed a latent, unrelated Docker bug while doing a full-stack build verification**: `apps/web/Dockerfile` runs a workspace-wide `pnpm install` (which triggers `apps/api`'s `prisma generate` postinstall) but never copied `apps/api/prisma` first — unlike `apps/api/Dockerfile`, which does this deliberately. This has been silently broken since the Postgres migration below (the live `web` container hadn't been rebuilt since before that migration, so nothing had hit it yet); fixed by copying `apps/api/prisma` early, same as the API Dockerfile already does.
* **Verified via disposable, non-production containers** (project name `gym-verify`, torn down after each check — the live `gym` project was never touched): a full multi-stage `docker build` for both `api` and `web`; a 5-service boot (`db`+`redis`+`minio`+`api`+`web`) all healthy with a clean Nest boot log; a live sign-in → current-session → sign-out cycle confirmed against real Redis (checked key creation/TTL/deletion directly via `redis-cli`); a live member-photo upload → fetch-with-auth (200) → fetch-without-auth (401) cycle confirmed against real MinIO (checked the object landed in the bucket via `mc ls`). Unit suite (5/5) and e2e suite (30/32, same 2 pre-existing date-drift failures as before this work — see the Postgres migration entry below) both pass.
* **ROADMAP.md updated**: one line added to "Current completed work" and one to Phase 1 → Core Platform's module list.

Next

* **Production cutover for Redis + MinIO** — not yet done; deliberately deferred until requested. Should follow the same backup-first, verify-at-every-step discipline as the Postgres cutover below (bring up `redis`/`minio` alongside the still-running old containers, verify health, then cut over `api`).
* Phase 4 cleanup from the Postgres migration (deleting `operations-store.ts`/`settings-store.ts`/JSON seed files) is still waiting on its burn-in period — unrelated to this session's Redis/MinIO work, just a reminder it's still open.

Notes

* The 2 pre-existing e2e failures (`dashboard summary` counts, one member's computed `status`) are date-drift, unrelated to any of this session's work — confirmed present identically before and after both the Postgres migration and this Redis/MinIO change.
* A third e2e test (`membershipActivated` notification dispatch) is flaky under the full suite only (passes in isolation) because it makes a real network call to the SparkCo API — pre-existing, unrelated, not something this session introduced or fixed.

---

## 2026-07-03 (Postgres + Prisma Migration — Persistence Layer, incl. Production Cutover)

Completed

* **Replaced the flat-JSON persistence layer with PostgreSQL via Prisma**, with real foreign keys — triggered by a code-review question about why `Member.homeBranchId`/`registeredEmployeeId` were plain strings instead of FKs (answer: there was no database at all; everything lived in `operations-store.ts`/`settings-store.ts`/an inline auth store, read and written as whole JSON files).
* **Schema**: all 15 models (Tenant, Branch, Employee, EmployeeGate, Gate, Member, MembershipPlan, Membership, Freeze, Visit, Payment, Notification, TenantSettings, User, Session), enums, indexes, and FKs in `apps/api/prisma/schema.prisma`; initial migration `20260703074526_init` (15 tables, 27 FKs).
* **Module-by-module cutover** (lowest-risk first: settings → branches/employees/gates → auth → members → memberships/visits/access → payments/notifications → reports) — every feature service now talks to `PrismaService` directly (no repository/DAO layer). The `auth` conversion cascaded into making session lookups async everywhere, which touched ~50 call sites across 14 controllers (mechanical `async`/`await`, no logic changes). Two module-dependency cascades forced phases 3d–3g to land as one continuous pass rather than separately reviewable steps, since a half-converted intermediate state broke record creation immediately (not just showed stale data).
* **One-time data migration script** (`apps/api/src/scripts/migrate-json-to-postgres.ts`) reads the live `.local/*.json` files, inserts everything in FK order, and hard-fails on any row-count mismatch. Idempotency-guarded (`--force` required to re-run against non-empty data).
* **Production cutover executed** (2026-07-03 ~15:25 UTC) against the live `gym.sparkco.vip` deployment: backed up the `gym_api-data` volume first, built the new image without touching running containers, brought up `db` alongside the still-running old `api`/`web`, ran the migration as a one-off container against the real production `.local` data (all 12 row-count checks passed — 15 members, 17 memberships, 30 visits, 23 notifications, etc. — confirming this was real accumulated production data, not seed fixtures), spot-checked the imported data via `psql`, then cut over `api` (brief restart; `web` untouched). Verified through the actual public domain, not just container-internal checks.
* **E2e test isolation adapted for Postgres**: `jest-e2e-setup.ts` points at a dedicated `gym_test` database and runs migrations once before the suite; `resetPrismaTestData()` does a single `TRUNCATE ... CASCADE` (not per-model `deleteMany()`, which raced against un-closed app instances from earlier tests) followed by reseeding. Also fixed a real pre-existing gap while doing this: `app.e2e-spec.ts` never called `app.close()` between tests, which could make an earlier test's error surface as a failure in a later, unrelated test once Postgres was in the loop.
* Full detailed write-up, including every Prisma-v7-specific gotcha hit (driver adapters now mandatory, new generator/output path, `moduleFormat: cjs`, Dockerfile layer ordering, Jest `moduleNameMapper`, `NODE_OPTIONS=--experimental-vm-modules`, etc.) is in [POSTGRES_MIGRATION.md](POSTGRES_MIGRATION.md).

Next

* **Phase 4 cleanup** (delete `operations-store.ts`/`settings-store.ts`/JSON seed files) — code-ready (confirmed nothing outside the store/migration files reads them), deliberately waiting on a burn-in period in production before removing the JSON files as a rollback reference.
* Redis (session storage) and MinIO (member photo storage) work — see the entry above; this was the direct follow-up to standing up Postgres.

Notes

* 2 of 32 e2e tests fail (dashboard summary counts, one member's computed status) — confirmed pre-existing and unrelated to this migration (identical failures with `PrismaModule` temporarily removed).
* Rollback path if ever needed: pre-cutover backup tarball has the original JSON files; the migration only ever reads `.local/*.json`, never writes/deletes, so the volume itself is untouched.

---

## 2026-06-26 (Branch-Session Routing Fix for WhatsApp Notifications)

Completed

* **Root cause identified and fixed — "WhatsApp not ready (status: no session)"** — when a membership was renewed the gym API sent a WhatsApp notification via SparkCo, which queued the job with only `tenantId`. The SparkCo worker looked for a session keyed by `tenantId` alone, but the actual session was stored under `${tenantId}:Platinum Fitness` (branch-scoped). Error: `WhatsApp not ready for [3c5d6579-…] (status: no session)`.
* **Worker fallback** — `WhatsAppSessionManager.sendMessage()` now falls back to any connected `${tenantId}:*` branch session when no direct tenant-level session exists. Deployed immediately by patching the compiled JS in `comm-worker` and restarting the container.
* **Explicit `sessionId` routing (SparkCo API)** — `MessageJobData` (types package), `SendMessageDto`, `SendBulkDto`, and `MessagesService` all gained an optional `sessionId` field. When provided, the processor uses `${tenantId}:${sessionId}` directly. `comm-api` and `comm-worker` rebuilt and redeployed.
* **Gym notification dispatch wired to branch** — `NotificationDispatchService.deliver()` now passes `member.homeBranchId` as `sessionId` for WhatsApp channel sends. `SparkcoNotificationProvider` forwards it in the request body. `NotificationDeliveryInput` interface extended with `sessionId?: string`. `gym-api-1` rebuilt and redeployed.
* **All three containers live** — `comm-api`, `comm-worker`, `gym-api-1` all running new builds. Branch session `[3c5d6579-…:Platinum Fitness] WhatsApp client ready` confirmed in worker logs.

Next

* **End-to-end smoke test** — renew a membership for the member with phone 0527388286 and confirm the WhatsApp message arrives.
* **Second branch WhatsApp** — test connecting a different WhatsApp number to a second branch to confirm session isolation works correctly.
* **Option to share one WhatsApp across all branches** — owner-level setting to route all branch notifications through a single session (discussed; deferred until basic per-branch flow is stable).

---

## 2026-06-26 (Per-Branch WhatsApp — QR Connect on Branch Detail Page)

Completed

* **Removed global settings/whatsapp** — the previous global WhatsApp settings page (`/app/settings/whatsapp`) was wrong; WhatsApp is now per-branch, not per-gym. The settings page was replaced with a branch-list redirect: it shows all branches and links each one to its detail page where WhatsApp is managed.
* **Per-branch WhatsApp in gym backend** — `TenancyService` replaced its global methods with four branch-scoped methods (`connectBranchWhatsApp`, `getBranchWhatsAppQr`, `verifyBranchWhatsApp`, `disconnectBranchWhatsApp`). Each passes the `branchId` as `sessionId` to the SparkCo API. `TenancyController` exposes the four routes at `PUT|DELETE /tenancy/whatsapp/branches/:branchId` and `POST|GET /tenancy/whatsapp/branches/:branchId/verify|qr`. Owner-only for connect/disconnect, owner+manager for verify/QR.
* **Next.js proxy routes** — three new route handler files under `apps/web/src/app/api/tenancy/whatsapp/branches/[branchId]/` (root PUT/DELETE, `/verify` POST, `/qr` GET) forward requests to the gym backend with session cookies.
* **`WhatsAppCard` client component** — new file `apps/web/src/app/app/branches/[branchId]/WhatsAppCard.tsx`. Shows "Connect WhatsApp" → start session → QR code (rendered with `qrcode` package) → scan → "Connected" badge. Polls every 3 s while waiting for QR; drops to 8 s heartbeat once connected to detect device removal. When the linked device is deleted from WhatsApp, automatically shows a yellow "Device disconnected — waiting for new QR…" state, then displays the fresh QR once the worker restarts the session (no page reload required).
* **Branch detail page updated** — `apps/web/src/app/app/branches/[branchId]/page.tsx` imports and renders `WhatsAppCard` alongside the branch details card. WhatsApp is now a first-class item on each branch page.
* **SparkCo API key fixed** — the old key in `apps/api/.env` was invalid. Owner created a new tenant-scoped API key via the SparkCo dashboard and updated the file. Docker API container restarted (no rebuild needed — env loaded at runtime from the mounted `.env` file).
* **`clientId` sanitization fix** — `whatsapp-web.js` `LocalAuth` only allows alphanumeric, underscores, and hyphens in `clientId`. The session key `${tenantId}:${branchId}` contains a colon and can contain spaces (e.g. "Platinum Fitness"). Fixed in the SparkCo worker: `key.replace(/[^a-zA-Z0-9_-]/g, '_')` is used as `clientId` while the raw key continues to be used for Redis.
* **Worker crash on device removal fixed** — when a linked device is removed from WhatsApp, `whatsapp-web.js`/Puppeteer throws `"Execution context was destroyed"` as an uncaught exception, crashing the Node.js process. Fixed in `apps/worker/src/main.ts`: global `uncaughtException` and `unhandledRejection` handlers suppress these specific Puppeteer errors so the worker stays alive.
* **`auth_failure` auto-restart fixed** — after a crash+restart, the worker finds stale (now-revoked) auth credentials in the session directory, which triggers `auth_failure`. Previously this just logged the error and left the session stuck at `disconnected`. Now `auth_failure` calls `restartSession()` which clears the credentials and starts a fresh QR session.
* **Chromium lock cleanup in restart** — `restartSession()` now calls `clearChromiumLock(key)` before re-initialising, which deletes the `SingletonLock` file from the session directory so Chromium never blocks itself after an unclean shutdown.
* **All containers rebuilt and live** — SparkCo API, SparkCo worker, gym API, and gym web all rebuilt and restarted. End-to-end tested: QR appears, scan connects, device removal detected, new QR appears automatically.

Notes

* Each branch gets its own WhatsApp session in SparkCo, keyed by `${tenantId}:${branchId}` (sanitized to `${tenantId}_${branchId}` for Chromium). Branch sessions are stored in the `tenant_providers` table with `channel = 'whatsapp:${branchId}'`.
* The `WhatsAppCard` heartbeat interval is 8 s when connected and 3 s when waiting for QR. The QR TTL in Redis is 60 s; `whatsapp-web.js` refreshes it automatically before expiry.
* The SparkCo dashboard at `dashboard.sparkco.vip` remains private. Gym owners connect their WhatsApp entirely through the gym app — no SparkCo dashboard access required.

---

## 2026-06-26 (SparkCo Tenant Integration + Employees CRUD)

Completed

* **SparkCo tenant self-service WhatsApp endpoints** — added `PUT|GET|POST|DELETE /me/providers/whatsapp/*` to the SparkCo API (`/opt/sites/api`). These are authenticated with the tenant's own `X-API-Key`, so each gym can manage its own WhatsApp session without admin dashboard access. New files: `apps/api/src/modules/me/me.controller.ts`, `apps/api/src/modules/me/me.module.ts`. Exported `ProviderConfigsService` from `TenantsModule` to make it available.
* **Gym API — TenancyModule filled in** — previously an empty stub. Now contains `TenancyService` (proxies to SparkCo `/me/providers/whatsapp/*` using `SPARKCO_API_KEY`) and `TenancyController` (`PUT|GET|POST|DELETE /tenancy/whatsapp`, owner/manager protected). Files: `apps/api/src/modules/tenancy/tenancy.service.ts`, `apps/api/src/modules/tenancy/tenancy.controller.ts`.
* **Gym Web — WhatsApp settings page** — new client component at `/app/settings/whatsapp`. Gym owner clicks "Connect WhatsApp" → QR appears → polls every 3 s → shows "Connected" once scanned. Three Next.js proxy route handlers created at `apps/web/src/app/api/tenancy/whatsapp/`. WhatsApp tab added to sub-nav on all settings pages. i18n keys added (EN/AR/HE).
* **Employees CRUD — full implementation** — the employees module was a read-only 19-line stub. Now fully functional:
  * **API:** `createEmployee` (auto-generates `EMP-XXXX` sequence per tenant), `getEmployeeForTenant`, `updateEmployee`. New endpoints: `POST /employees`, `GET /employees/:id`, `PATCH /employees/:id`. Owner/manager protected for writes.
  * **Web:** `apps/web/src/lib/employees.ts` (lib with all 4 operations). Three new pages: `/app/employees` (list with branch, number, status badge), `/app/employees/new` (create form), `/app/employees/[employeeId]` (detail with inline edit form + deactivate/reactivate button).
  * **Nav:** "Employees" added to sidebar (owner/manager only), between Users & Roles and Membership Plans.
  * **i18n:** Full EN/AR/HE translations added for all employee strings and the nav key.
* **TypeScript** — zero errors on both `gym/apps/api` and `gym/apps/web` after all changes.

Next

* **Rebuild Docker containers** — all changes above are code-only; containers must be rebuilt to go live: `docker compose -f docker-compose.prod.yml up -d --build api web`
* **SparkCo API rebuild** — the `/me/providers/whatsapp/*` endpoints are in `/opt/sites/api`; that project also needs a rebuild/restart if running in Docker.
* **Fix SparkCo API key** — the key in `apps/api/.env` may be expired (was flagged on 2026-06-24). Get a fresh key from the SparkCo admin panel and update the file before WhatsApp QR delivery will work.
* **Physical WhatsApp QR test** — gym owner goes to Settings → WhatsApp → Connect → scans QR from their own phone. Verifies the gym's own WhatsApp number sends member notifications.

Notes

* Employee numbers auto-sequence per tenant: `EMP-0001`, `EMP-0002`, etc. The sequence is derived from existing records on each create — no counter stored separately.
* The WhatsApp settings page uses client-side polling (Next.js API route handlers proxy to the gym API, forwarding session cookies). The QR is rendered with the `qrcode` npm package already in the project.
* Gym owner does NOT need access to the SparkCo admin dashboard to connect their WhatsApp — that was the whole point of this session's work.

---

## 2026-06-24 (QR Code Access System — Full Implementation + Docker Build Fix)

Completed

* **RFID simulation (morning)** — assigned `rfidTag: A1B2C3D4` to MEM-0001, created active membership, simulated BAS-IP callback with `{"identifier_number":"A1:B2:C3:D4","identifier_type":"card"}` → access granted, visit logged ✅.
* **Critical discovery: gym uses QR codes, not RFID cards** — physical visit confirmed the Open Gate button works. The gym's existing system sends members a username+password to a mobile app where they show a QR code at the gate. The new plan: send new members their QR code via WhatsApp so they can present it at the AV-04SD QR scanner. Mobile app is deferred.
* **BAS-IP API spec reviewed for QR format** — `identifier_type: "qr"` requires `identifier_number` to be a **UUID**. Plain text / member numbers do not work. The device generates its own QR PNG from the UUID and can serve it via `GET /api/v1/access/identifier/item/{uid}/qr`.
* **Created `apps/api/src/common/qr.ts`** — `memberIdToUuid(memberId)` (member-<uuid> → plain UUID; seed IDs like `member-001` → stable `00000000-0000-0000-0000-<hex>`), `generateQrSig(memberId)` (HMAC-SHA256 for public download links), `makeQrPublicUrl(memberId)` (builds `https://<PUBLIC_DOMAIN>/api/members/:id/qrcode/public?sig=<hmac>`).
* **Updated `AccessService.resolveMember()`** — QR type now also matches `memberIdToUuid(m.id) === identifierNumber` so device callbacks (which send the UUID back) correctly resolve to the right member.
* **Updated `BasIpSyncService`** — added `pushQrIdentifier(memberId, name, startDate, endDate)` (pushes `identifier_type:"qr"` with UUID as content), `fetchQrPngFromDevice(uid)` (retrieves device-generated PNG), `lookupQrUidForMember(memberId)` (finds device uid via `link_id`). Removed the private `toUuid()` in favour of the shared `memberIdToUuid` from `common/qr.ts`.
* **Updated `MembershipsService`** — `syncToDevice()` now always calls `pushQrIdentifier()` (removed the `rfidTag` guard). `createMembership()` notification body now includes the HMAC-signed public QR download URL.
* **Updated `MembersService`** — added `getMemberQrCodeBuffer()` (session-protected; tries device PNG first, falls back to local `qrcode` npm), `getMemberQrCodeBufferById()` (for public endpoint), `verifyQrSig()`, `sendQrViaWhatsApp()` (direct SparkCo fetch, no circular DI).
* **Updated `MembersController`** — three new endpoints: `GET /members/:id/qrcode` (session, PNG), `GET /members/:id/qrcode/public?sig=` (HMAC-verified, attachment), `POST /members/:id/send-qr` (triggers WhatsApp send).
* **Updated `MembersService` (web)** — added `sendMemberQr()` helper using `authedFetch`.
* **Rewrote `/app/members/[memberId]/qr/page.tsx`** — was incorrectly generating QR from `member.id` string. Now uses `<img src="/api/members/:id/qrcode">` (server PNG via cookie session). Has "Send via WhatsApp" button (green, member phone required), Download link, Print button. Success/error banners via search params.
* **Updated i18n** — added `sendQrWhatsApp`, `qrSentSuccess`, `qrSentFailed` keys to all three locales (en/ar/he). Updated `qrCodeDescription` to mention "gym entrance to open the gate".
* **Fixed stale seed membership dates** — all 6 seed memberships in `operations-store.ts` had end dates in mid-June 2026. Updated to `2027-06-01` so e2e access tests pass (today is 2026-06-24).
* **Fixed Docker build — two root causes:**
  1. `.tsbuildinfo` files were being copied into the Docker build context. TypeScript's incremental build saw the stale build info, decided nothing had changed, and emitted nothing. Fixed by adding `*.tsbuildinfo` and `apps/*/*.tsbuildinfo` to `.dockerignore`.
  2. The `cp -r apps/api/dist /api-prod/dist` workaround that was added previously double-nested `dist/` into `/app/dist/dist/`. Removed this — `pnpm deploy --legacy` correctly copies `dist/` because it doesn't respect `.gitignore` in legacy mode.
* **Both containers live and healthy** — API startup log confirms all 3 QR routes registered: `GET /api/members/:memberId/qrcode`, `GET /api/members/:memberId/qrcode/public`, `POST /api/members/:memberId/send-qr`. Public endpoint returns 401 for invalid HMAC ✅.

Next

* **Fix SparkCo API key** — the key `cs_117794890876737b37c72242fe1404c1acbd6fb5c3c65e38` in `apps/api/.env` is expired (returns 401). Get a fresh key from the SparkCo admin panel and update the file, then rebuild: `docker compose -f docker-compose.prod.yml up -d --build api`. This unblocks WhatsApp QR delivery.
* **Physical QR test at gym** — register a new member with a phone number → create membership → QR synced to device automatically → WhatsApp message arrives with public QR link → member downloads QR → shows at AV-04SD gate → confirm access granted + visit logged.
* **Future: mobile app** — members should eventually view their QR code in a mobile app (deferred; WhatsApp delivery is the interim solution).

Notes

* QR content (what the device stores and what is encoded in the QR PNG): `memberIdToUuid(memberId)` — e.g. for `member-001` → `00000000-0000-0000-0000-000000000001`. This is what the device sends back as `identifier_number` in the RAS callback.
* Public QR download URL is HMAC-signed with `QR_SECRET` env var (falls back to `DEVICE_TOKEN`, then `dev-qr-secret`). The URL is unauthenticated and safe to share via WhatsApp.
* WhatsApp message is sent directly from `MembersService` via a raw SparkCo fetch (avoids injecting `NotificationsService` into `MembersService` which would create a circular dependency).
* The `dist/` issue in Docker: `pnpm deploy --legacy` copies the `dist/` folder even though it is in `.gitignore`. This is a quirk of legacy mode. No manual copy step is needed in the Dockerfile.

---

## 2026-06-20 (Remote Access Server Configured on Device)

Completed

* **Device Remote Access Server is live.** Configured via API (`POST /api/v1/access/general/remote/control/settings`) — the device web UI showed the same error as the API.
* **Key quirk found:** the device firmware rejects any `custom_server_api_url` that includes an `http://` or `https://` scheme prefix. The value must be a bare URL without scheme. Set correctly as:
  `gym.sparkco.vip/api/access/bas-ip?branchId=Platinum Fitness&token=a246b4d0aba5ac5cb4378aeb326cfbdd01545e587146a21a51ba53b9320da0d9`
* **Fixed RFID card format normalization** in `AccessService.resolveMember()` — device sends `AA:BB:CC:DD` (colon-separated), we store `AABBCCDD` (raw hex). Added `.replace(/[:\-]/g, '')` before comparison so both formats match.
* **`DEVICE_TOKEN`** updated to real 64-char hex value; API container rebuilt and live.

Next

* **Test end-to-end:** scan a card at the device → confirm our API receives the callback, logs the visit, and the gate opens. Check `docker logs gym-api-1 -f` during the scan to see the request.
* Add RFID tag to a test member and renew their membership to trigger the local-list sync, then test card scan both online (RAS) and offline (local list fallback).

Notes

* Device confirmed live at `http://213.8.132.134:8081`, firmware 3.12.0, model AV-04SD.
* When the device cannot reach our server within 10 s it falls back to its local identifier list.
* Settings verified via GET after POST: `{enabled: true, custom_server_enabled: true, custom_server_api_url: "gym.sparkco.vip/..."}`

---

## 2026-06-20 (Search Fix + Open Gate Button)

Completed

* **Fixed top-bar and check-in member search** — `MemberAutocomplete` fetches `/api/members/search?q=…` but Traefik routes all `/api/*` to NestJS, which had no such endpoint (the Next.js route handler was unreachable in production). Added `GET /members/search?q=` to `MembersController` **before** the `:memberId` route (order matters) to avoid the param collision. Now both the top-bar and check-in search show the autocomplete dropdown correctly.

* **`POST /access/gate/open`** — new NestJS endpoint (session-protected, any authenticated role). Calls `BasIpSyncService.openGate()` which authenticates with the BAS-IP device and calls `GET /api/v1/access/general/lock/open/remote/accepted/1`. Returns `{opened: true}` or `{opened: false, reason: "…"}`.

* **"Open Gate" button on check-in page** — `GateOpenButton` client component placed in the page header alongside the page title. Shows loading spinner while request is in-flight, switches to green check on success (auto-resets after 3 s), red on failure with the device's reason. Gate open is independent of the check-in form — staff can open the gate without checking anyone in.

* **i18n** — added `openGate` / `gateOpened` / `gateOpenFailed` to all three locales (en/ar/he).

* Both containers rebuilt and live. Smoke tests: `GET /api/members/search?q=test` → 401 ✓; `POST /api/access/gate/open` → 401 ✓ (correct — auth required).

Next

* RFID sync end-to-end test deferred to demo day (assign tag to a member in the app, verify it appears on the device).
* Generate a real `DEVICE_TOKEN` and update `apps/api/.env`, then configure the AV-04SD callback URL.
* Existing-member import strategy — ask the customer at the demo.

Notes

* The search endpoint returns up to 8 results filtered by full name or member number (case-insensitive), scoped to the user's tenant and branch. The Next.js `/app/api/members/search/route.ts` is now dead code in production (Traefik routes to NestJS before Next.js sees it); it still works in local dev.
* Gate open is a best-effort call — if `BASIP_DEVICE_URL` is not set the button shows "Failed to open gate / Device not configured." on the VPS (where URL is empty), but works on machines that have it set.

---

## 2026-06-20 (BAS-IP Device Live Test + Sync Fixes)

Completed

* **Device confirmed live** — `GET http://213.8.132.134:8081/api/info` returns 200. Device is an **AV-04SD** (not AV-03BD; same API family), firmware 3.12.0, API version 1.3.5.
* **Lock open confirmed** — `GET /api/v1/access/general/lock/open/remote/accepted/1` returns 200 and opens the gate. Tested twice.
* **Two bugs found and fixed in `BasIpSyncService`:**
  1. **Wrong URL base** — all API calls used `${deviceUrl}/path` but the real base is `${deviceUrl}/api/v1/path`. Added `apiBase` getter that appends `/api/v1`; updated `authenticate`, `pushIdentifier`, `removeIdentifier`.
  2. **Card number format** — device requires colon-separated hex pairs (`AA:BB:CC:DD`), not raw uppercase hex (`AABBCCDD`). Added `formatCardNumber()` helper that inserts `:` every 2 characters.
  3. **Missing `apartment_link_id`** — the `/access/identifier/items/link` POST requires both `link_id` and `apartment_link_id`. We pass the same member UUID for both (gym has no apartment concept).
* **Full identifier sync cycle tested manually:** push (created), query by link_id, delete (deleted) — all 200.
* **API rebuilt** (3×) with all fixes — live at `https://gym.sparkco.vip/api`.

Next

* Assign a real RFID tag to a member in the app, then verify the tag appears on the device after membership creation (end-to-end sync test with real hardware).
* Generate a real `DEVICE_TOKEN` (`openssl rand -hex 32`) and update `apps/api/.env`, then configure the AV-04SD callback URL: `https://gym.sparkco.vip/api/access/bas-ip?branchId=<id>&token=<DEVICE_TOKEN>`.
* Decide on existing-member import strategy before the demo.

Notes

* Device URL is `http://213.8.132.134:8081` (public IP, not LAN — accessible from VPS too). This means BAS-IP sync will work from the VPS directly, not just from a local machine.
* Auth: `GET /api/v1/login?username=admin&password=<MD5-uppercase>` → Bearer token (no expiry observed during testing).
* The GET `/access/identifier/items/link?link_id=...` needs `limit` and `page_number` params — not needed for our sync use case.

---

## 2026-06-20 (API Rebuild — BAS-IP Sync Deployed)

Completed

* **Rebuilt and redeployed API container** with `BasIpSyncService` — the BAS-IP local list sync code from the 2026-06-20 session is now live on the VPS.
  * `docker compose -f docker-compose.prod.yml up -d --build api` ran cleanly (~15s).
  * `GET https://gym.sparkco.vip/api` → `{"status":"ok"}` confirmed.
* **Added BASIP vars to `apps/api/.env`** — `BASIP_DEVICE_URL`, `BASIP_DEVICE_USERNAME`, `BASIP_DEVICE_PASSWORD` added as empty strings (intentional — VPS cannot reach gym LAN; sync calls skip silently by design).

Next

* Generate a real `DEVICE_TOKEN` (`openssl rand -hex 32`) and update `apps/api/.env` before connecting the BAS-IP hardware to the callback URL.
* Configure `BASIP_DEVICE_URL` / credentials on a machine that **can** reach the gym's LAN (during demo or on-site setup).
* Configure the BAS-IP AV-03BD device with the callback URL: `https://gym.sparkco.vip/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>` (Settings → Access → Remote Access Server → Custom server).
* Decide on existing-member import strategy before the demo: ask the customer whether they can export member/card data from the old system, or whether we pull identifiers directly from the gate via `GET /access/identifier/items`. Do not build until the answer is known.

Notes

* The VPS deployment is stable: both `gym-api-1` and `gym-web-1` containers are Up. SSL via Traefik. Web at port 3001, API at port 3002.
* `DEVICE_TOKEN` is still the placeholder value — safe until the BAS-IP device is pointed at the callback URL.

---

## Next Session — Start Here (SERVER DEPLOYMENT)

**Context for Claude:** The user has uploaded this repo to a VPS. We are now doing the live deployment. All Docker files are ready. Work through the checklist below step by step, running commands on the server as the user executes them.

---

### What is already done (local machine)
- `apps/api/Dockerfile` — multi-stage NestJS build via `pnpm deploy --prod`; WORKDIR `/app`; `.local/` is NOT in the image (it's a volume)
- `apps/web/Dockerfile` — multi-stage Next.js standalone build; `NEXT_PUBLIC_API_BASE_URL` baked in at build time as a build arg
- `apps/web/next.config.ts` — `output: "standalone"`, `outputFileTracingRoot` = repo root (needed for pnpm monorepo)
- `docker-compose.yml` — services: `api` (port 3002), `web` (port 3001), `nginx` (80/443), `certbot`; reads `DOMAIN` from root `.env`; volume `api-data` → `/app/.local` in API container
- `nginx/nginx.conf` + `nginx/templates/app.conf.template` — nginx reverse proxy; `${DOMAIN}` substituted at container start; `/api` → api:3002, `/` → web:3001; ACME challenge served from `certbot-www` volume
- `scripts/init-ssl.sh` — issues Let's Encrypt cert via certbot standalone (briefly uses port 80), then starts all services
- `.env.example` (root) — template for `DOMAIN` + `CERTBOT_EMAIL`
- `apps/api/.env.example` — template for `SPARKCO_API_KEY` + `DEVICE_TOKEN`

### Path / volume notes (important for debugging)
- API data stores use `join(__dirname, '..', '..')` to find the API root. In Docker `__dirname` = `/app/dist/data/` → API root = `/app/`. `.local/` = `/app/.local/` = the `api-data` volume mount point.
- Auth store uses `join(__dirname, '..', '..', '..')` (one level deeper at `dist/modules/auth/`) → also resolves to `/app/`.
- Seed files live at `/app/data/` inside the container (copied by `pnpm deploy` from `apps/api/data/`).
- Web standalone: server entry point = `apps/web/server.js` inside the container WORKDIR `/app`. Static files at `apps/web/.next/static/`. Public files at `apps/web/public/`.
- Docker volume names are prefixed by compose project name (default = directory name, e.g. `gym`). So volumes are `gym_api-data`, `gym_certbot-certs`, `gym_certbot-www`.

### Deployment checklist (execute on server in order)

```
[ ] 1. Confirm Docker + Docker Compose are installed
        docker compose version   # must be v2

[ ] 2. Confirm port 80 + 443 are open in the VPS firewall
        (Hetzner: Firewall rules; DigitalOcean: ufw allow 80,443/tcp)

[ ] 3. Confirm domain A record points to this server IP
        dig +short yourdomain.com   # should return server IP

[ ] 4. Create root .env
        cp .env.example .env
        nano .env
        # → DOMAIN=yourdomain.com
        # → CERTBOT_EMAIL=email@example.com

[ ] 5. Create API .env
        cp apps/api/.env.example apps/api/.env
        nano apps/api/.env
        # → SPARKCO_API_KEY=cs_117794890876737b37c72242fe1404c1acbd6fb5c3c65e38
        # → DEVICE_TOKEN=$(openssl rand -hex 32)   ← generate and paste

[ ] 6. (Optional) Migrate live .local/ data into Docker volume
        docker volume create gym_api-data
        docker run --rm \
          -v "$(pwd)/apps/api/.local:/src" \
          -v "gym_api-data:/dest" \
          alpine sh -c "cp -r /src/. /dest/"

[ ] 7. Build images (takes ~5 min first time)
        docker compose build

[ ] 8. Issue SSL cert + start everything
        bash scripts/init-ssl.sh
        # If port 80 is blocked: check firewall (step 2)
        # If domain not resolving: check DNS (step 3)

[ ] 9. Verify
        curl -I https://yourdomain.com          # should return 200
        curl https://yourdomain.com/api         # should return {"message":"..."} or 404
        docker compose ps                        # all containers should be "Up"

[ ] 10. Configure BAS-IP AV-03BD
        Settings → Access → Remote Access Server → Custom server:
        https://<DOMAIN>/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>
```

### Common first-deployment errors and fixes
- **nginx fails to start: "cannot load certificate"** → SSL cert not issued yet; run `bash scripts/init-ssl.sh` first.
- **`init-ssl.sh` fails: "Address already in use :80"** → something is on port 80 (`lsof -i :80`); stop it first.
- **API container exits immediately** → check `docker compose logs api`; likely missing env var in `apps/api/.env`.
- **Web returns 502** → web container still starting (Next.js standalone can take ~15s); watch `docker compose logs web`.
- **`pnpm deploy` fails inside Docker build** → pnpm version mismatch; the Dockerfile pins `pnpm@10.12.4` via corepack — matches local.
- **NEXT_PUBLIC_API_BASE_URL wrong** → it's baked at build time; if domain changed, `docker compose build web && docker compose up -d web`.

### Also pending (lower priority, tackle after deployment is stable)
- ~~e2e / live store isolation fix (running tests wipes `.local/operations-store.json`)~~ ✓ done 2026-06-18
- ~~`reportingDate` staleness in the store (stuck at 2026-06-05, affects expiry scan)~~ ✓ done 2026-06-18
- ~~Membership date arithmetic for UTC-N timezones in `memberships.service.ts`~~ ✓ done 2026-06-18

---

## 2026-06-20 (BAS-IP Local List Sync — Offline Access via Device Identifier Push)

Completed

* **`BasIpSyncService`** created at `apps/api/src/modules/access/bas-ip-sync.service.ts`. Pushes member RFID identifiers to the AV-03BD's local access list so the device can grant access instantly and offline, without a round-trip to our server.
  * `pushIdentifier(memberId, memberName, rfidTag, startDate, endDate)` — POSTs to `/access/identifier/items/link` using `link_id` = member UUID; bakes membership start/end as `valid.time.from/to` Unix timestamps so the device enforces expiry automatically.
  * `removeIdentifier(memberId)` — DELETEs from `/access/identifier/items/link` by `link_id`; called on member deactivation for immediate revocation.
  * `authenticate()` — `GET /login?username=&password=<MD5-uppercase>` per the verified API spec; token passed as `Authorization: Bearer`.
  * All methods are **best-effort and silent**: if `BASIP_DEVICE_URL` is unset or the device is unreachable (VPS cannot reach gym LAN), they log a warning and return without error. The Remote Access Server continues handling all real-time access control regardless.

* **`AccessModule`** now provides and exports `BasIpSyncService`.

* **`MembershipsService`** now calls `syncToDevice(member, membership)` after:
  * `createMembership` — when status is `active`
  * `renewMembership` — always (renewal is always active)
  * `createFreeze` — pushes the extended `endDate` so the device's valid window stretches with the freeze duration

* **`MembersService`** now calls `removeIdentifier` when a member transitions `active` → `inactive`.

* **`.env.example`** updated with `BASIP_DEVICE_URL`, `BASIP_DEVICE_USERNAME`, `BASIP_DEVICE_PASSWORD` and a note that these are only set on a machine that can reach the gym's LAN (not the VPS).

* **All tests pass** — 32 e2e + 5 unit.

Next

* Rebuild Docker: `docker compose -f docker-compose.prod.yml up -d --build api`
* Configure `BASIP_DEVICE_URL` / credentials on the machine used during demo (not the VPS)
* Decide on existing-member import strategy: ask the customer at the demo whether they can export member/card data from the old system, or whether we pull identifiers directly from the gate via `GET /access/identifier/items` — do not build until the answer is known

Notes

* The device is on the gym's **local network**; the VPS cannot reach it. Sync calls from the VPS will always skip silently — this is by design.
* Membership expiry is enforced by the device itself via `valid.time.to` — no explicit removal needed when a membership simply lapses. `removeIdentifier` is only needed for immediate revocation (deactivation, cancellation).
* `link_id` design: member IDs are `member-<uuid>`; we strip the prefix to get a clean UUID the device accepts. Seed IDs like `member-001` are converted to a stable `00000000-0000-0000-0000-<hex>` format.

---

## 2026-06-19 (BAS-IP AV-03BD API Deep Dive — Access Control Architecture)

Completed

* **Full AV-03BD API spec documented** — reviewed and annotated every route in `docs/AV-03BD_API.md`. All previously-marked `NEED DETAILS` entries now have the actual endpoint spec (method, path, params, request body, response schema) filled in below the index. Categorized routes as `ALREADY USING`, `NEED DETAILS` (now resolved), and `NICE TO HAVE`.

* **Key API endpoints now understood:**
  * **Auth:** `GET /login?username=&password=<MD5>` → returns Bearer token; all subsequent calls require `Authorization: Bearer <TOKEN>`.
  * **Identifier CRUD:** `POST /access/identifier` creates an identifier (card/ukey/inputCode/qr/license\_plate) with optional validity window (`valid.time.from/to`) and pass counter (`valid.passes.max_passes`). Returns device-internal `uid`. CRUD at `GET|PATCH|DELETE /access/identifier/item/:identifierUid`.
  * **Bulk sync via `link_id`:** `POST /access/identifier/items/link` — upsert by `link_id` (our member ID). `DELETE /access/identifier/items/link` — remove by `link_id`. `GET /access/identifier/items/link` — query by `link_id`. This is the primary sync mechanism; we never need to track the device's internal `uid`.
  * **Time Profiles:** `POST /access/timeprofile` defines an access schedule (daily/weekly/custom repeat with start/end times). Attach to an identifier via `POST /access/identifier/item/:id/timeprofile/:profileId`. Also sync-able via `link_id` endpoints. This is how gym opening hours are enforced at the device level.
  * **Direct lock open:** `GET /access/general/lock/open/remote/accepted/:lockNumber` (logged as "Lock opened from web interface") — bypasses the Remote Access Server callback flow; useful for admin override.
  * **Remote Access Server config:** `GET|POST /access/general/remote/control/settings` — reads/writes `{enabled, custom_server_enabled, custom_server_api_url}`. Use this to programmatically set our callback URL instead of manual device UI configuration.
  * **Door sensor:** `GET /access/door/sensor` (settings), `GET /access/door/status` → `{status: "open"|"closed", opentime, is_timeout_exceed}`. Useful for monitoring dashboard.
  * **Camera snapshot:** `GET /photo/file` → returns `image/jpeg` binary (base64 in practice). Can be attached to a visit record at the moment of access for audit trail.
  * **Access logs:** `GET /log/items` with `from`/`to` Unix timestamps. Events include `access_granted_by_valid_identifier`, `access_denied_by_unknown_card`, `access_denied_by_remote_server_api_call`, `door_sensor_was_opened`, etc. Can reconcile against our visit log to detect missed events.
  * **IP whitelist:** `PUT /security/whitelist` — restrict device API to our server's IP only.
  * **Emergency:** `POST /access/general/lock/open/emergency` / `POST /access/general/lock/close/emergency` — bulk open/close with duration; could expose a gym-side emergency button.

* **Access control architecture discussion** — evaluated whether to keep `member.rfidTag` or introduce `access_profiles` / `access_rules`. Conclusion: the direction toward separating credentials from the member entity is correct and the BAS-IP API validates it — the device itself is already designed around `Identifier` entities (multi-type: card/QR/PIN/ukey/plate) + `Time Profile` entities, decoupled from owner/apartment records. The `link_id` field is the designed bridge for a management system to maintain its own ID namespace across devices.

Next

* Implement identifier sync: when a member's credential is created/updated/deactivated, push to device via `POST /access/identifier/items/link` with `member.id` as `link_id`.
* Create a default `Time Profile` for gym opening hours and attach it to all member identifiers on sync.
* Decide: keep `member.rfidTag` for now and add `member_credentials` table when a second credential type (QR, PIN) is needed — or introduce it now. Recommendation: add `member_credentials` table now since the device already supports multiple types and the schema change is small.

Notes

* The device has a 10-second timeout on the Remote Access Server callback before falling back to its local identifier list. If our server is unreachable, members stored locally can still enter — this is the intended offline fallback.
* `link_id` in all bulk endpoints is a UUID string — use our `member.id` directly.
* Time Profile `repeat_options` supports complex schedules (daily, weekly, bi-weekly, monthly, work-week). For a simple gym use case, a single "Work week Mon–Sat 06:00–22:00" time profile attached to all identifiers is sufficient.
* The `valid.time.from/to` fields on an identifier (Unix timestamps) control the credential's active window independently of the time profile. Use `to` = membership `endDate` to auto-expire the credential at the device level even if our server is offline.
* Pass counter (`valid.passes.max_passes`) maps to session-based memberships (e.g. 12-visit plan); `POST /access/identifier/item/:id/passes/reset` resets the counter on renewal.

---

## 2026-06-18 (Post-Deployment Bug Fixes)

Completed

* **e2e / live store isolation** — `operations-store.ts` and `auth.service.ts` now compute their file paths via a `getStorePaths()` / `getAuthPaths()` helper that checks `process.env.API_DATA_ROOT` first, falling back to the `__dirname`-relative default. The e2e test sets `API_DATA_ROOT` to a per-process temp dir in `beforeEach` and removes it in `afterAll`. Tests no longer touch `apps/api/.local/` on the host machine.
* **`reportingDate` staleness** — removed the store field as the source of "today" for `MembersService.getReportingDate()` and `NotificationsService.scanForExpiryNotifications()`; both now call `localDateString()` directly. Expiry scan was previously stuck comparing against `2026-06-05`, so no upcoming expirations were ever raised after the seed date.
* **Membership date arithmetic (UTC-N)** — added `addDays(dateStr, days)` helper to `common/date.ts` that uses `setUTCDate`/`getUTCDate` instead of the local-time equivalents. Applied to all four date-computation sites in `memberships.service.ts`: renewal start (day after old end), renewal end (start + durationDays), membership creation end date, and freeze extension. Was previously off by one day on UTC-N servers.
* Updated two e2e dashboard-summary assertions that were relying on the stale `reportingDate`; test 1 now expects 0 check-ins and $0 payments from seed (seed data is from 2026-06-05); test 2 uses `new Date().toISOString()` for the visit and payment it creates so they appear in today's counts. All 32 e2e + 5 unit tests pass.

Next

* n/a — deployment is stable and all known post-deployment issues are resolved.

---

## 2026-06-18 (Docker Deployment Setup)

Completed

* **Docker deployment setup** — added full production deployment config targeting a VPS:
  * `apps/api/Dockerfile` — multi-stage NestJS build using `pnpm deploy --prod` for a minimal runtime image; `.local/` data is not baked in (mounted as Docker volume `api-data`).
  * `apps/web/Dockerfile` — multi-stage Next.js build using standalone output; `NEXT_PUBLIC_API_BASE_URL` is passed as build arg so the public domain is baked into the client bundle.
  * `apps/web/next.config.ts` — added `output: "standalone"` and `outputFileTracingRoot` pointing to repo root (required for pnpm monorepo standalone to include shared node_modules).
  * `docker-compose.yml` — orchestrates `api`, `web`, `nginx`, and `certbot`; reads `DOMAIN` from root `.env`; mounts `api-data` volume for store persistence; injects `NEXT_PUBLIC_API_BASE_URL` as a build arg from `DOMAIN`.
  * `nginx/nginx.conf` + `nginx/templates/app.conf.template` — nginx reverse proxy with SSL termination; routes `/api` to NestJS and `/` to Next.js; template variables (`$DOMAIN`) are substituted at container start by the official nginx image.
  * `scripts/init-ssl.sh` — one-shot script for first-time SSL cert issuance via certbot standalone; stops nginx briefly, issues cert, then starts all services.
  * `.dockerignore` — excludes `node_modules/`, `.next/`, `dist/`, `.local/`, and build artifacts from the Docker build context.
  * `.env.example` (root) — documents `DOMAIN` + `CERTBOT_EMAIL`.
  * `apps/api/.env.example` — documents `SPARKCO_API_KEY` + `DEVICE_TOKEN` (with `openssl rand -hex 32` note).
  * `deploy.md` — step-by-step VPS deployment guide covering initial setup, data migration, BAS-IP device configuration, daily operations, SSL renewal, and troubleshooting.

Next

* Execute the deployment on the VPS following [deploy.md](deploy.md).
* Set a real `DEVICE_TOKEN` (`openssl rand -hex 32`) in `apps/api/.env` before connecting hardware.
* Configure the BAS-IP AV-03BD with the callback URL.

Notes

* The web container bakes `NEXT_PUBLIC_API_BASE_URL` at image build time (Next.js limitation for `NEXT_PUBLIC_*` vars). If the domain changes, the web image must be rebuilt (`docker compose build web && docker compose up -d web`).
* All three data stores (operations, auth, settings) resolve paths relative to the API package root using `__dirname`. In Docker (WORKDIR `/app`), `.local/` resolves to `/app/.local/` which is where the `api-data` volume is mounted.
* Certbot auto-renews every 12 h via the `certbot` container's entrypoint loop. The webroot challenge path `/var/www/certbot` is served by nginx's HTTP block.

---

## 2026-06-18 (BAS-IP Spec Verification + Adapter Correction)

Completed

* **Fetched and verified the real BAS-IP API spec** from developers.bas-ip.com. The AV-03BD is a Camdroid Panel (individual entrance panel). Its Remote Access Server protocol is identical to the Android Panels API and works as follows: device POSTs `{"identifier_number": "...", "identifier_type": "card|input_code|qr"}` to a configurable URL; our server responds `{"handled": true, "access": {"granted": true, "lock_number": 1}}`. 10-second timeout before device falls back to local list. No auth headers supported — token goes in the URL as `?token=`.
* **Corrected the BAS-IP adapter** from the assumed spec to the verified spec: renamed endpoint `POST /access/rfid` → `POST /access/bas-ip`; replaced `{tagId, branchId}` payload with `{identifier_number, identifier_type}`; `branchId` now comes from URL query param; response changed from `{signal: "open"}` to `{handled: true, access: {granted: true, lock_number: 1}}`; guard switched from `X-Device-Token` header to `?token=` query param.
* **`AccessService` now handles all 3 identifier types**: `card` → lookup by `rfidTag`; `qr` + `input_code` → lookup by member UUID or member number. Single QR code entry point covers both manual QR scan and keypad member number entry.
* **Updated integration doc** (`docs/bas-ip-integration.md`) with verified payload format, response format, device configuration steps, and vendor-extension pattern. Hardware provider's claim confirmed: the Remote Access Server protocol is shared across Camdroid and Android Panels.
* All 32 e2e + 5 unit tests pass; web build clean.

Next

* Deploy to public HTTPS domain so the device can be configured with the callback URL.
* Set a real `DEVICE_TOKEN` in `.env` before connecting hardware.

Notes

* The BAS-IP developer portal has **separate API docs** for each device family (Door Controller, Android Panels, Camdroid Panels, etc.) — so different BAS-IP products do NOT share one API. However, the Remote Access Server feature uses the same protocol across families.
* When the device can't reach our server within 10 s, it falls back to its own stored card list. Until the online integration is set up, the device works purely offline.

---

## 2026-06-18 (Phase 4 — RFID Access Control Sprint)

Completed

* **Adapter-pattern access module** — built `apps/api/src/modules/access/` with a hardware-agnostic `AccessService.checkAccess(rfidTag, branchId)` at the core. Added `BasIpController` (`POST /access/rfid`) and `BasIpDeviceGuard` (`X-Device-Token` header auth) as the first vendor adapter under `adapters/`. Adding a future vendor (ZKTeco, Suprema, etc.) requires only a new guard + controller action — zero changes to `AccessService`.
* **`rfidTag` field on members** — added `rfidTag?: string` to `MemberRecord` in `operations-store.ts`; threaded through `MembersService` (auto-uppercased on save), `MembersController`, `lib/members.ts` (`Member` type), new/edit forms (Access Control section), and member profile (violet chip badge).
* **`'rfid'` access method** — added to `VisitRecord.accessMethod` union; visits list shows a violet `RFID` badge alongside the existing QR/manual badges.
* **`DEVICE_TOKEN` env var** — added to `apps/api/.env` with a placeholder comment; guard reads it at request time (never at boot).
* **3 new e2e tests** — grant for member with tag + active membership; deny for unknown tag; 401 for wrong device token. All 32 e2e + 5 unit tests pass; web build clean.

Next

* Confirm BAS-IP model with customer → configure device callback URL and token.
* Assign RFID tag IDs to members via the member edit form.

Notes

* `AccessService` derives `tenantId` from `branchId` (branch IDs are globally unique) — no per-tenant device token required at the pilot stage.
* Tag IDs are stored uppercase; the device sends raw hex which may be upper or lower case — normalize on input so comparisons always work.
* Response is always HTTP 200; the device reads the `signal` field (`"open"` or `"deny"`), not the HTTP status.

---

## 2026-06-18 (SparkCo Email + WhatsApp Live, UTC/Local Date Fix)

Completed

* **Routed email through SparkCo** — `notification-dispatch.service.ts` `selectProvider` now sends both `email` and `whatsapp` channels through `SparkcoNotificationProvider` when `SPARKCO_API_KEY` is set. Previously email went to `SmtpNotificationProvider`. `SmtpNotificationProvider` removed from `NotificationsModule` and `NotificationDispatchService` (class and tests kept; just removed from DI). `.env` cleaned up — SMTP vars removed, duplicate SparkCo entries deduplicated.
* **Live delivery confirmed** — `membershipActivated` notifications dispatched: email (`channel: "email"`) and WhatsApp (`channel: "whatsapp"`) both returned `status: sent` with real `sentAt` timestamps via SparkCo API (`POST /api/v1/messages/send`). `basel51@gmail.com` targeted.
* SMS channel continues to fall back to console logger (reserved for future SparkCo SMS tier).

Next

* n/a — delivery confirmed end-to-end.

---

## 2026-06-18 (Pilot Release Gate Walkthrough + UTC/Local Date Fix)

Completed

* **Pilot release gate walkthrough** — ran the full member lifecycle end-to-end against the live API (port 3002) with owner credentials: sign in → branch setup (two branches with `countryCode: PS`) → member registration (phone auto-normalized `0599111222` → `+970599111222`) → membership sale → payment → check-in (granted) → renew (old expired, new with `previousMembershipId`) → freeze (end date extended) → unfreeze (back to active). All steps passed.
* **UTC/local date fix** (`apps/api/src/common/date.ts`) — added `localDateString(date?)` utility that uses `Date#getFullYear/getMonth/getDate` (local timezone) instead of `toISOString().slice(0, 10)` (UTC). Applied to `visits.service.ts` check-in `today` comparison and `reports.service.ts` `toDateKey` visit-grouping helper. Fixes a bug where at midnight IDT (UTC+3) Node's UTC date lagged the local date by one day, causing check-ins to fail for memberships created with today's local date.
* All 5 unit tests and 29 e2e tests pass after the fix.

Next

* Set `SPARKCO_API_KEY` + `SPARKCO_API_URL` and `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` env vars to activate real WhatsApp and email delivery for notifications.
* Normalize member phone numbers in the live `.local/` store if any non-E.164 numbers remain (current live store members all have `+`-prefixed numbers already).

Notes

* The UTC/local date issue also exists in `memberships.service.ts` for date arithmetic (renewal end-date, freeze end-date), but those operate on user-supplied date strings parsed as UTC midnight — the arithmetic is consistent in UTC+N timezones. Left unchanged for now; only affects UTC-N servers.
* All pilot data is in the live `.local/` store and persists across restarts. The walkthrough test member (`MEM-0007`) remains in the store.

---

## 2026-06-14

Completed

* Fixed branch detail page (`/app/branches/[branchId]`) not displaying the country name after a country was selected on a branch. Imported `COUNTRIES` list, resolved `branch.countryCode` to its display name at render time, and added a **Country** row to the details card (falls back to `—` when unset).

---

## 2026-06-13 (Multi-Country Support & Phone Number Normalization)

Completed

* **Replaced Twilio and sent.dm with SparkCo** (`apps/api/src/modules/notifications/providers/sparkco-notification.provider.ts`). WhatsApp now routes through the privately-operated SparkCo communication service (`api.sparkco.vip`). Email continues via SMTP. SMS channel is preserved in the data model for a future paid tier but always falls back to console. `SPARKCO_API_KEY` / `SPARKCO_API_URL` env vars replace all Twilio/sentdm vars. Removed `twilio` and `@sentdm/sentdm` npm packages; removed the provider-selection dropdown and sentdm template field from the Settings → Notifications page.
* **Country per branch (Option 2):** Added a static `COUNTRIES` list (`apps/api/src/data/countries.ts`, mirrored at `apps/web/src/lib/countries.ts`) containing ~60 countries with ISO 3166-1 alpha-2 codes and E.164 dial codes. Added `countryCode?: string` to `BranchRecord`; branches without a country set are backward-compatible and skip normalization. Updated `BranchesService` / `BranchesController` to accept `countryCode` on create and update; added a country dropdown to the branch new/edit pages.
* **Phone normalization:** Added `normalizePhone(raw, dialCode)` in `apps/api/src/common/phone.ts`. Called by `MembersService` on `createMember` and `updateMember` for both `phone` and `emergencyContactPhone`. Numbers already starting with `+` are left unchanged; local numbers get the branch's dial code prepended after stripping leading zeros. If the branch has no `countryCode` the raw value is stored unchanged (opt-in per branch).
* **Pre-flight validation in dispatch:** `NotificationDispatchService.deliver` now rejects WhatsApp sends with a clear `failedReason` when the stored phone number does not start with `+`, so owners can identify and fix malformed numbers through the Notifications log rather than sending to an invalid recipient.

In Progress

* n/a

Next

* Pilot release gate walkthrough with real credentials end-to-end.
* Normalize existing member phone numbers in the live `.local/` store (manual edit or a one-time migration script).

Notes

* Existing members in the live store keep their current (possibly un-normalized) phone numbers. Edit and re-save a member to trigger normalization once their branch has a `countryCode` assigned.
* The `countryCode` field on branches is optional; existing branch records without it continue to work — member phones are stored as-is and dispatch returns a clear error if the number lacks a country code.
* SparkCo WhatsApp sends the message from the platform's linked WhatsApp number — no "from" phone number needs to be configured per tenant.

---

## 2026-06-08 (Notification Delivery — Real Provider Scaffolding)

Completed

* Built `TwilioNotificationProvider` (`apps/api/src/modules/notifications/providers/twilio-notification.provider.ts`) for real SMS/WhatsApp delivery via the Twilio SDK, and `SmtpNotificationProvider` (`.../providers/smtp-notification.provider.ts`) for real email delivery via `nodemailer`. Both implement the existing `NotificationProvider` interface, lazily build their client/transporter from env vars (so DI never throws at boot when credentials are absent), and fail gracefully with a descriptive error — never crash — when unconfigured or missing a sender identity.
* Added `from?: string` to `NotificationDeliveryInput` and threaded the tenant's configured sender identity (`notificationSenders` from Settings) through `NotificationDispatchService.deliver` for both `dispatchNotificationForTenant` and `dispatchPendingForTenant`, via a new `getNotificationSendersForTenant`/`resolveFrom` pair — this is what makes the Settings → Sender identities fields introduced 2026-06-07 actually live.
* Updated `NotificationsModule`'s provider factory to pick the real provider per channel automatically: Twilio is used for `sms`/`whatsapp` when `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` are both set, SMTP is used for `email` when `SMTP_HOST` + `SMTP_USER` + `SMTP_PASSWORD` are all set; otherwise each channel falls back to `ConsoleNotificationProvider` (logging only, current pilot behavior). **No other code in the dispatch pipeline needs to change to go live** — dropping in real credentials is enough.
* Added 9 new unit tests (`twilio-notification.provider.spec.ts`, `smtp-notification.provider.spec.ts`) with mocked SDK calls covering: graceful failure when unconfigured, failure when no sender identity is set, successful send with correct `from`/`to`/`body` (incl. the `whatsapp:` prefix Twilio requires on both numbers for WhatsApp), and failure handling when the SDK call rejects. Lint, full unit suite (10/10), `nest build`, and the e2e suite (29/29) all pass.

To go live

* Set these env vars on the API process: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (Twilio — enables real SMS/WhatsApp), and `SMTP_HOST`, `SMTP_PORT` (default `587`), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` (`"true"`/`"false"`, default `false`) (SMTP — enables real email). Then fill in the corresponding sender identities under Settings → Notifications → Sender identities.

Notes

* Both providers were deliberately written to always be safe to instantiate (lazy client creation, `undefined` client when env vars are missing) because Nest registers them unconditionally alongside `ConsoleNotificationProvider` — only the factory's channel-to-provider mapping changes based on env var presence.

---

## 2026-06-07 (Notification Delivery — Sender Identities & Scheduled Job)

Completed

* Added `NotificationSenderSettings` (`smsFrom`, `whatsappFrom`, `emailFrom`) to `TenantSettingsRecord` (`apps/api/src/data/settings-store.ts`) — lets the owner configure the per-tenant "from" phone numbers (SMS/WhatsApp) and "from" email address that real providers (Twilio, SendGrid/SMTP) require once connected. `SettingsService.updateSettingsForTenant` normalizes input (trims, lowercases email) the same way `MembersService` does for member contact fields; `getSettingsForTenant` falls back to defaults for tenant records that predate this field (mirrors the existing `notificationSettings` fallback — caught and fixed a `null` regression for the seeded `tenant-spark-gym` record during manual verification).
* Extended `SettingsController`/`SettingsService` update DTOs and `apps/web/src/lib/settings.ts` types with `notificationSenders`; PATCH remains owner/manager-only (unchanged guard, re-verified front-desk gets 403).
* Added a "Sender identities" section to `/app/settings/notifications` (three text inputs: SMS sender number, WhatsApp sender number, email sender address) with help text explaining each is required by the eventual delivery provider; added `sendersSection*`/`sender*` translation keys to `i18n.ts` for `en`/`ar`/`he`.
* Installed `@nestjs/schedule`, registered `ScheduleModule.forRoot()` in `AppModule`, and added `NotificationsSchedulerService` (`apps/api/src/modules/notifications/notifications-scheduler.service.ts`) — a daily `@Cron(EVERY_DAY_AT_7AM)` job that iterates every tenant (derived from distinct `tenantId`s in the operations store members) and runs `scanForExpiryNotifications` + `dispatchPendingForTenant` automatically, replacing the need to call `POST /notifications/scan` / `POST /notifications/dispatch` by hand. Logs a per-tenant summary (created/sent/failed) and isolates failures per tenant so one tenant's error doesn't block the rest.
* All 29 e2e tests pass; web build still produces 37 dynamic routes; manually verified via signed-in API/web requests that the sender fields save, persist, normalize, and render (including RTL/Arabic) correctly, and that front-desk PATCH attempts still 403.

Resolved (see 2026-06-08 entry above)

* At the time of this entry, dispatches still went through `ConsoleNotificationProvider` only — `TwilioNotificationProvider`/`SmtpNotificationProvider` were scaffolded the next day and the `notificationSenders` fields are now live (threaded through as the provider's `from` address).

Next

* Pilot release gate walkthrough: sign in → branch setup → member registration → membership sale → payment → check-in → renew → freeze → unfreeze end-to-end with real credentials (carried over from Sprint 8).

Notes

* `notificationSenders` fields are optional and stored as `undefined` when blank (same convention as optional member `phone`/`email`); the UI shows them empty until the owner fills them in.
* The scheduler derives the tenant list from `operations-store` members rather than the settings store, since every tenant has members but not every tenant necessarily has a customized settings record yet.
* `EVERY_DAY_AT_7AM` was chosen as a sensible pilot default for a single daily run; it is trivially adjustable (or could become tenant-configurable) once real usage patterns are observed.

---

## 2026-06-07 (Notification Delivery — Groundwork)

Completed

* Added `NotificationProvider` interface (`apps/api/src/modules/notifications/providers/`) plus a `NotificationProviderMap` (per-channel registry) so real backends (Twilio for SMS/WhatsApp, SMTP/SendGrid for email, ...) can be dropped in later without touching the dispatch pipeline.
* Added `ConsoleNotificationProvider` — a pilot/dev stand-in that "sends" by logging to the Nest logger and marks the record `sent`/`failed` based on whether the member has a contact address for that channel (`phone` for sms/whatsapp, `email` for email). Registered for all three channels via a factory provider in `NotificationsModule`.
* Added `NotificationDispatchService` with `dispatchNotificationForTenant` (single, owner/manager) and `dispatchPendingForTenant` (batch) — resolves the recipient address, calls the channel's provider, and persists the resulting `status`/`sentAt` back onto the `NotificationRecord`. Rejects re-dispatching non-pending records with 400.
* Added `POST /notifications/:notificationId/dispatch` and `POST /notifications/dispatch` (owner/manager-only) endpoints.
* Extended `NotificationRecord` with optional `event` (`membershipExpiring | membershipExpired | paymentPending | membershipActivated`) and `relatedId` fields for traceability and dedup.
* Added `NotificationsService.createNotificationsForEvent(tenantId, event, memberId, context)` — the single seam business flows go through to raise a notification; reads the tenant's `notificationSettings` (Settings → Notifications) and fans out one pending record per enabled channel for that event.
* Wired event-driven creation into business flows: `MembershipsService.createMembership`/`renewMembership` now raise `membershipActivated`, `PaymentsService.createPayment` raises `paymentPending` when the payment is recorded as pending.
* Added `NotificationsService.scanForExpiryNotifications(tenantId)` — scans active/expired memberships and raises `membershipExpiring` (within the configured `daysBefore` window) / `membershipExpired` notifications, skipping memberships already notified for that event (dedup via `event` + `relatedId`). Exposed as `POST /notifications/scan` (owner/manager-only); stands in for the daily scheduled job that doesn't exist yet.
* Added 4 e2e tests: membership sale raises a pending `membershipActivated` notification; dispatching a pending notification for a member with a contact address marks it `sent` with `sentAt` (and rejects re-dispatch with 400); the expiry scan is owner/manager-only (403 for front-desk), creates notifications, and is idempotent on re-run.
* Fixed 2 pre-existing stale e2e assertions in the dashboard-summary tests (label text `"Today check-ins"` / `"Payments logged"` had drifted from the current `"Today's check-ins"` / `"Payments today"`, and the seeded active-membership count had grown from 3 to 5 across earlier sprints without the assertions being updated) — unrelated to this work but were blocking a clean suite run.
* All 29 e2e tests pass; web build still produces 37 dynamic routes (no frontend changes in this slice).

In Progress

* Delivery infrastructure and event-driven creation are in place behind a console/log provider — no real SMS/WhatsApp/email credentials wired up yet (by design; `ConsoleNotificationProvider` is the swap-in seam for Twilio/WhatsApp Cloud API/SMTP later).
* The expiry scan is manually triggered via `POST /notifications/scan`; there is still no scheduled job to run it automatically on a daily cadence.

Next

* Wire a real delivery backend behind the `NotificationProvider` interface once SMS/WhatsApp/email provider credentials are available (only the factory in `NotificationsModule` needs to change).
* Add a scheduled job (or pilot-acceptable manual cron substitute) to run `scanForExpiryNotifications` and `dispatchPendingForTenant` automatically.
* Pilot release gate walkthrough: sign in → branch setup → member registration → membership sale → payment → check-in → renew → freeze → unfreeze end-to-end with real credentials (carried over from Sprint 8).

Notes

* Seeded members have no `phone`/`email` on file, so dispatching seed-originated notifications will resolve to `status: 'failed'` (no contact address) — this is expected and exercises the failure path; new members created with contact info dispatch successfully against the console provider.
* `membershipActivated` only sends via `email` by default per `defaultNotificationSettings`; `membershipExpiring`/`membershipExpired`/`paymentPending` default to `sms`. Channel selection always flows through the tenant's `notificationSettings`, never hardcoded per event.
* Dedup for the expiry scan keys on `(event, relatedId)`; the original seeded notifications (`notif-001..005`) predate these fields and are therefore not deduped against — re-running the scan will raise fresh records for those memberships once, then stop.

---

## 2026-06-05 (Sprint 8)

Completed

* Created `src/common/require-role.ts` — shared `requireRole(user, allowed)` helper that throws `ForbiddenException` when the session user's role is not in the allowed list.
* Applied role guards across four controller groups:
  * `PATCH /settings` — owner-only.
  * `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id` — owner + manager.
  * `POST /branches`, `PATCH /branches/:id` — owner + manager.
  * `POST /memberships/plans`, `PATCH /memberships/plans/:id` — owner + manager.
* Added `unfreezeM(tenantId, membershipId)` to `MembershipsService`: validates membership is frozen, sets status to `active`; rejects with 400 if not frozen.
* Added `POST /memberships/:membershipId/unfreeze` endpoint to `MembershipsController`.
* Added `unfreezeMembership(membershipId)` fetch helper to `lib/memberships.ts`.
* Created `/app/members/[memberId]/unfreeze` — confirmation page showing the frozen membership details and a "Re-activate membership" server action; redirects to member profile on success.
* Updated member profile quick actions: "Re-activate membership" button (blue, distinct from freeze) is visible when a frozen membership exists; sprint label updated to Sprint 8.
* Updated 4 pre-existing e2e tests that used `frontdesk` credentials to call now-guarded write endpoints — changed to use `owner` credentials.
* Added 3 new e2e tests: front-desk rejected from `PATCH /settings`, `POST /branches`, `POST /memberships/plans`, and `GET /users` (all return 403); owner succeeds on the same guarded endpoints; freeze → unfreeze → second unfreeze rejected flow.
* All 26 e2e tests pass; web build produces 37 dynamic routes.

In Progress

* Sprint 8 is complete. MVP is feature-complete and pilot-ready.

Next

* Pilot release gate walkthrough: sign in → branch setup → member registration → membership sale → payment → check-in → renew → freeze → unfreeze end-to-end with real credentials.
* Notification delivery integration (currently records-only, no SMS/email/WhatsApp dispatch) — Phase 2.

Notes

* Role matrix: `PATCH /settings` is owner-only; branch write, user management, and plan management are owner+manager; all operational routes (members, check-in, payments, visits, reports, notifications) are accessible to all roles.
* `unfreeze` sets status directly to `active` and preserves the extended end date that was set during the freeze. There is no partial-freeze credit — the end date adjustment is permanent.
* Front-desk users receive HTTP 403 on guarded endpoints; unauthenticated requests still receive HTTP 401.

---

## 2026-06-05 (Sprint 7)

Completed

* Added `FreezeRecord` type (`id`, `membershipId`, `startDate`, `endDate`, `createdAt`) to `operations-store.ts`; added `freezes: FreezeRecord[]` to `OperationsStoreData` with normalization default `freezes: []`.
* Added `previousMembershipId?: string` to `MembershipRecord` for renewal traceability.
* Added `renewMembership(tenantId, membershipId, input)` to `MembershipsService`: creates a new active membership from the same (or different) plan, marks the old membership as `expired`, defaults start date to day after old end date, auto-computes end date from plan durationDays.
* Added `createFreeze(tenantId, membershipId, input)` to `MembershipsService`: validates plan allows freeze, membership is active, freeze days within plan limit; sets membership status to `frozen` and extends membership end date by freeze duration.
* Added `listFreezesForMembership(tenantId, membershipId)` to `MembershipsService`.
* Added `POST /memberships/:membershipId/renew`, `POST /memberships/:membershipId/freeze`, and `GET /memberships/:membershipId/freezes` endpoints to `MembershipsController`.
* Added `renewMembership`, `createFreeze`, `listFreezesForMembership` fetch helpers to `lib/memberships.ts`.
* Created `/app/members/[memberId]/renew` — renewal form with plan selector (defaults to current plan), start date (defaults to day after current end), optional price override; redirects to member profile on success.
* Created `/app/members/[memberId]/freeze` — freeze form with eligibility check (plan allows freeze), freeze history, start/end date inputs, max-days hint; redirects to member profile on success; shows clear error when plan doesn't allow freeze.
* Updated member profile quick actions: added "Renew membership" (always visible) and "Freeze membership" (visible when active membership exists); removed placeholder "Check in — Sprint 5" stub; updated sprint label to Sprint 7.
* Added 3 e2e tests: renew marks old membership expired and creates new active membership with `previousMembershipId`; freeze extends end date and sets status to frozen; freeze rejected on plan without freeze allowed.
* All 23 e2e tests pass; web build produces 36 dynamic routes.

In Progress

* Sprint 7 is complete. MVP pilot workflow is now fully implementable end-to-end.

Next

* Pilot release gate validation: sign in → branch setup → member registration → membership sale → payment → check-in → renew/freeze flow end-to-end.
* Role guards at controller layer (owner/manager-only route enforcement).
* Notification delivery integration (currently records-only, no external channel).

Notes

* Renewal creates a new membership record per MVP policy; the old membership transitions to `expired`. `previousMembershipId` on the new record preserves the billing chain.
* Freeze sets the membership status to `frozen` and extends the `endDate` by the freeze duration. The membership re-activation after the freeze period is not yet automated — front-desk staff must manually update the status back to `active` via the existing PATCH endpoint until a scheduled job is added.
* Freeze validation checks: plan.freezeAllowed, membership.status === 'active', freeze duration ≤ plan.freezeMaxDays.

---

## 2026-06-05 (Sprint 6)

Completed

* Added `NotificationRecord` type to operations-store with `channel`, `subject`, `body`, `status`, `sentAt`, and `createdAt` fields; seeded 4 tenant-spark-gym notifications and 1 tenant-other-gym notification.
* Added `notifications: []` normalization default so existing stores without the field upgrade cleanly.
* Built `NotificationsService` with `listNotificationsForTenant` (sorted newest-first) and `getNotificationForTenant` (404 on miss); built `NotificationsController` with `GET /notifications` and `GET /notifications/:notificationId`; registered both in `NotificationsModule` with `AuthModule` import.
* Extended `ReportsService` with four new report methods: `getActiveMembershipsReport`, `getExpiredMembershipsReport`, `getVisitsReport` (dateFrom/dateTo params), `getPaymentsReport` (dateFrom/dateTo params, totalPaid aggregate).
* Extended `ReportsController` with four new endpoints: `GET /reports/active-memberships`, `GET /reports/expired-memberships`, `GET /reports/visits`, `GET /reports/payments`; all tenant/branch-scoped.
* Created `lib/notifications.ts` with `Notification` type, `listNotifications`, and `getNotification`.
* Created `lib/reports.ts` with typed row types and fetch helpers for all four report endpoints.
* Created `/app/notifications` — list page showing channel badge, status badge, member name, and creation time; links to detail.
* Created `/app/notifications/[notificationId]` — detail page with notification info card and linked member card.
* Created `/app/reports` — landing page with four report cards.
* Created `/app/reports/active-memberships` — table with member name, plan, start/expiry dates, and price.
* Created `/app/reports/expired-memberships` — table with member name, plan, dates, status badge, and price.
* Created `/app/reports/visits` — table with member name, access method badge, and check-in time; accepts `dateFrom`/`dateTo` search params.
* Created `/app/reports/payments` — table with member, method, status badge, date, and amount; shows total-paid summary; accepts `dateFrom`/`dateTo` search params.
* Wired Notifications and Reports nav items with hrefs; both are now active links in the sidebar.
* Added 3 e2e tests: notifications list is tenant-scoped; active-memberships report returns active rows; payments report returns totals.
* All 20 e2e tests pass; web build produces 34 dynamic routes.

In Progress

* Sprint 6 is complete.

Next

* Sprint 7: Membership renewals (`/app/members/:memberId/renew`), membership freezes (`/app/members/:memberId/freeze`), and pilot hardening (role guards, regression QA).

Notes

* Notifications are stored in the operations store alongside members, memberships, payments, and visits — no external delivery service yet.
* Report endpoints default `dateFrom`/`dateTo` to today (the reporting date) when not provided; `active-memberships` and `expired-memberships` ignore date params and always reflect the current state.
* The expired-memberships report includes any membership whose `endDate < today` OR whose `status === 'expired'`, ensuring in-flight status updates and natural expiry are both captured.

---

## 2026-06-05 (Sprint 5)

Completed

* Added `checkIn(tenantId, branchId, input)` to VisitsService — validates member is active, resolves an active membership covering today, creates the visit record, and returns a typed discriminated union (`granted: true | false`); never throws for access-denied cases.
* Added `POST /visits/check-in` endpoint (HTTP 200) to VisitsController; placed before the `:visitId` parameterized route to avoid conflicts.
* Created `lib/visits.ts` with `Visit` type, `listVisits`, and `getVisit`.
* Created `lib/check-in.ts` with `CheckInResult` discriminated union type and `performCheckIn(identifier, accessMethod)`.
* Created `/app/check-in` — server component with server action; shows a large member-number input, submits via server action, and redirects back with result in search params; result banner renders green (granted) or red (denied) with member name, plan, and expiry / denial reason.
* Created `/app/visits` — sorted visits list with member name join, member number, access-method badge, and local timestamp; links to detail.
* Created `/app/visits/[visitId]` — visit detail with check-in time, access method, branch, and linked member card.
* Wired Check-In and Visits nav items with hrefs; both items are now active links in the sidebar.
* Added 3 e2e tests: access granted for active member with valid membership; denied for unknown member number; denied for member with no membership.
* All 17 e2e tests pass; web build produces 27 dynamic routes.

In Progress

* Sprint 5 is complete.

Next

* Sprint 6: Notifications list + details, Reports home, and report endpoints (active memberships, expired memberships, visits, payments).
* Add role guards to controller layer to enforce owner/manager-only routes.

Notes

* Check-in accepts `memberNumber` or `memberId` as `memberIdentifier` — supports both QR (which encodes the UUID) and manual (which uses the human-readable number).
* Check-in result is always HTTP 200; `granted: false` with a `reason` string is the denial path — HTTP errors only for auth/server failures.
* The check-in page uses search params for result state so the form resets cleanly between each check-in without client-side JS.

---

## 2026-06-05 (Sprint 4)

Completed

* Added `listMembershipsForMember` to MembershipsService with plan enrichment (returns each membership annotated with its plan object).
* Enforced one-active-membership-per-member rule in `createMembership`; returns 400 if an active membership already exists.
* Auto-calculates `endDate` from `plan.durationDays` when not provided; defaults `finalPrice` to `plan.price`.
* Added `GET /memberships/member/:memberId` endpoint to MembershipsController.
* Added `listPaymentsForMember` to PaymentsService and `GET /payments/member/:memberId` endpoint to PaymentsController.
* Created `lib/memberships.ts` with `Membership` type and `listMembershipsForMember` / `createMembership` helpers.
* Created `lib/payments.ts` with `Payment` type and `listPaymentsForMember` / `createPayment` helpers.
* Updated member profile page: live memberships section (sorted newest-first, with plan name + status badge), live payments section (sorted newest-first), and real action links for "Sell membership" and "Record payment" that reflect whether an active membership exists.
* Created `/app/members/[memberId]/memberships/new` — sell membership form with plan selector, start date, optional end date override, optional price override; redirects to profile on success.
* Created `/app/members/[memberId]/payments/new` — record payment form with membership selector, amount, method, status, and datetime; redirects to profile on success.
* Added 4 new e2e tests: sell membership + list by member, reject second active membership, record payment + list by member, reject zero/negative payment.
* Fixed stale `operations-seed.json` (written before Sprint 3 added plan fields) — now deleted on each test run so seeds always regenerate from `defaultOperationsSeed`.
* All 14 e2e tests pass; web build produces 25 dynamic routes.

In Progress

* Sprint 4 is complete.

Next

* Sprint 5: Check-in screen (QR + manual lookup), visit tracking, visit list.
* Add role guards to controller layer to enforce owner/manager-only routes.

Notes

* `GET /memberships/member/:memberId` returns memberships with inline `plan` object (or null if plan missing).
* `createMembership` now defaults `status` to `'active'` and auto-computes `endDate` for duration plans.
* e2e `beforeEach` now also deletes `data/operations-seed.json` to prevent stale seed issues across sprints.

---

## 2026-06-05 (Sprint 3)

Completed

* Expanded MembershipPlanRecord with planType (duration/session), durationDays, sessionCount, price, freezeAllowed, freezeMaxDays. Updated seed data and normalization.
* Expanded MemberRecord with phone, email, dateOfBirth, emergencyContactName, emergencyContactPhone, medicalNotes (all optional).
* Added createMembershipPlan, getMembershipPlanForTenant, updateMembershipPlan to MembershipsService.
* Added POST/GET/PATCH /memberships/plans/:planId endpoints to MembershipsController.
* Updated MembersService and MembersController to persist and return all new member profile fields.
* Created lib/membership-plans.ts with full CRUD helpers (list, get, create, update).
* Updated lib/members.ts Member type and createMember/updateMember signatures for new fields.
* Built /app/membership-plans (list), /app/membership-plans/new, /app/membership-plans/:planId (detail), /app/membership-plans/:planId/edit — all wired to backend with server actions.
* Rebuilt member new/edit forms with phone, email, date of birth, home branch selector, emergency contact, and medical notes sections.
* Updated member profile to display all new fields with conditional rendering.
* Membership Plans nav link now has href and is active in the sidebar.
* All 10 e2e tests pass; web build produces 21 dynamic routes.

In Progress

* Sprint 3 is complete.

Next

* Sprint 4: Membership sale (sell to member), payment recording, and member-level membership/payment history on the profile.
* Add role guards to controller layer to enforce owner/manager-only routes.
* Business-rule enforcement: one active membership per member.

Notes

* Membership plans API lives at /memberships/plans/* (nested under the memberships controller).
* Plan type is stored explicitly — duration or session — so future session tracking doesn't require inference.
* All new member fields are optional; existing seeded members simply omit them.

---

## 2026-06-05 (Sprint 2.5)

Completed

* Created settings-store.ts with a standalone per-tenant settings store following the same file-based pattern as operations-store.ts.
* Built SettingsService (get/update per tenant) and SettingsController (GET/PATCH /settings) with tenant isolation and validation: default language must be in enabled list, at least one language required.
* Registered SettingsModule in AppModule.
* Added lib/settings.ts on the frontend with getSettings() and updateSettings() using the existing authedFetch pattern.
* Created /app/settings/page.tsx (redirects to /app/settings/language) and /app/settings/language/page.tsx with a server-action form showing the default language dropdown and per-language enable/disable toggles.
* Root layout.tsx is now async and reads the spark_gym_lang cookie to set lang and dir on <html>, enabling full server-side RTL for Arabic and Hebrew from the first render.
* Saving settings sets the spark_gym_lang cookie to the new default language so the direction change takes effect immediately on redirect.
* Settings link added to NavMenu, visible to owners only.
* All 10 e2e tests still pass; web build produces 16 dynamic routes including /app/settings and /app/settings/language.

In Progress

* Settings is complete for Sprint 2.5.

Next

* Sprint 3: Membership plans CRUD (list, create, detail, edit) and richer member profiles (emergency contacts, medical notes).
* Add role guards to controller layer to enforce owner/manager-only routes.
* Strengthen business-rule enforcement: one active membership per member, plan-branch eligibility, freeze policy.

Notes

* Language cookie name: spark_gym_lang. Values: en | ar | he.
* Default tenant seeded with English as default language and all three languages enabled.
* Saving settings immediately applies the new language direction to the whole app via the html[dir] attribute — no JavaScript required.

---

## 2026-06-05 (Sprint 2)

Completed

* Extended BranchRecord with status, address, and phone fields; added normalization for existing records.
* Built BranchesService and BranchesController with full CRUD (list, create, get, update) and tenant isolation.
* Added user management methods to AuthService (listUsersForTenant, getUserForTenant, createUser, updateUser) including password hashing.
* Built UsersModule with UsersController covering GET/POST /users, GET /users/:id, PATCH /users/:id, and GET /roles.
* Expanded memberships with GET /:id and PATCH /:id (status, date, price updates).
* Expanded payments with GET /:id and visits with GET /:id.
* Built frontend branches pages: list, create, detail, edit — wired to backend with server actions.
* Built frontend members pages: list, create, profile, edit — wired to backend with server actions.
* Built frontend users pages: list, create, detail — and a roles overview page with access matrix.
* Extracted NavMenu into a client component using usePathname() for accurate active-link highlighting.
* Updated all nav links in AppShell for branches, users, and members sections.
* Added 4 new e2e tests covering branches CRUD, users CRUD, roles listing, error validation, and duplicate email rejection.
* All 10 e2e tests pass, lint is clean, and web build produces 14 dynamic routes.

In Progress

* Sprint 2 backend and frontend foundation for branches, users, and roles is complete.
* Role enforcement at the controller layer (guard-based) is still done per-session check only; formal role guards are deferred.

Next

* Sprint 3: Membership plans list/create/edit and members CRUD with richer profile data (photo, emergency contacts, medical notes).
* Add role guards to protect owner/manager-only endpoints at the controller layer.
* Strengthen business-rule enforcement: one active membership per member, plan-branch eligibility, freeze policy.

Notes

* BranchRecord now includes status (active/inactive), address, and phone. Existing records normalize to status=active on first read.
* Users are stored in the auth store alongside session data; new users can sign in immediately after creation.
* The owner password hash in the seed does not match owner123 in e2e tests — all e2e tests use frontdesk credentials consistently.
* NavMenu is a client component so usePathname() highlights the active route correctly in the sidebar.

---

## 2026-06-05

Completed

* Added the first real Nest auth endpoints for sign-in, sign-out, and current-session.
* Seeded pilot staff accounts and issued HTTP-only session cookies for frontend auth flow testing.
* Wired the Next.js sign-in page to the backend and moved the protected shell onto `/app` and `/app/dashboard`.
* Protected the app shell and dashboard on the server by resolving the current session before render.
* Added role-aware shell navigation and session context display in the frontend.
* Updated API e2e coverage to validate the current root response plus the auth/session flow.
* Replaced the in-memory auth store with a persistent local auth store seeded from hashed pilot user records.
* Added a protected dashboard summary endpoint and replaced the frontend's static dashboard cards with tenant-scoped API data.
* Replaced precomputed dashboard cards with real aggregates computed from persisted member, membership, visit, and payment records.
* Filtered dashboard quick actions by authenticated role and covered the summary endpoint with API e2e tests.
* Moved operational source records out of the reports module and behind module-owned member, membership, visit, and payment services plus protected list/create endpoints.
* Added API e2e coverage that creates records through module endpoints and verifies the dashboard summary updates from those writes.

In Progress

* Sprint 1 authentication is working end-to-end with a local persistent auth store suitable for pilot development.
* Module-owned operational APIs now sit on top of a shared local runtime store and still need fuller CRUD coverage plus richer business validation.

Next

* Expand member, membership, visit, and payment endpoints beyond list/create into fuller CRUD and business-rule enforcement.
* Continue branch and role management work behind the protected app shell.

Notes

* Pilot sign-in credentials are `frontdesk@sparkgym.local` / `frontdesk123` and `owner@sparkgym.local` / `owner123`.
* The protected frontend route now follows the planned `/app/dashboard` path instead of an unscoped dashboard URL.
* Runtime auth state is stored under `apps/api/.local/` and seeded from `apps/api/data/auth-seed.json`.
* Operational runtime data is stored in `apps/api/.local/operations-store.json`, seeded from `apps/api/data/operations-seed.json`, and owned by the member, membership, visit, and payment modules.

## Current Summary

* Project state: Active development
* Current phase: Phase 1 active with some Phase 0 enabling work still open
* Current sprint focus: Sprint 1 protected shell plus module-backed operational reporting
* Package manager standard: pnpm

---

## Update Template

Use this format for each day:

```markdown
## YYYY-MM-DD

Completed

* Item

In Progress

* Item

Next

* Item

Notes

* Item
```

---

## 2026-06-05

Completed

* Finalized the MVP planning stack across requirements, business rules, workflow, user stories, route map, implementation tickets, sprint backlog, and milestone board.
* Standardized the project on pnpm and documented that choice in the planning files.
* Created the pnpm monorepo workspace at the project root.
* Scaffolded the frontend in `apps/web` with Next.js.
* Scaffolded the backend in `apps/api` with NestJS.
* Added `start.md` with daily run instructions.
* Replaced the default frontend template with a Sprint 0 sign-in screen, app shell, and dashboard scaffold.
* Replaced the default backend hello-world setup with API bootstrap configuration and MVP-aligned module skeletons.
* Validated the workspace with lint, tests, and build commands.

In Progress

* Sprint 0 technical foundation is partially complete and has enough baseline structure to start Sprint 1.
* Sprint 1 authentication and protected-shell wiring is the next active engineering target.

Next

* Add the first auth endpoint in the Nest backend.
* Add current-session handling for the frontend shell.
* Wire the sign-in page to the backend and protect dashboard access.
* Continue Sprint 0 items that are still missing, especially technical architecture and shared error-handling conventions.

Notes

* Frontend runs on `http://localhost:3001` because port `3000` is already occupied on this machine.
* Backend should be started on `http://localhost:3002` to avoid port conflicts.
* Daily startup instructions are documented in `start.md`.

Continue Spark Gym ERP from the current repo state and start Sprint 1.

First read these files for context:
- [status.md](status.md)
- [ROADMAP.md](ROADMAP.md)
- [start.md](start.md)
- [docs/MVP-Requirements.md](docs/MVP-Requirements.md)
- [docs/Business-Rules.md](docs/Business-Rules.md)
- [docs/Pilot-Workflow.md](docs/Pilot-Workflow.md)
- [docs/Web-App-User-Stories.md](docs/Web-App-User-Stories.md)
- [docs/Web-App-Route-Map.md](docs/Web-App-Route-Map.md)
- [docs/Web-App-Implementation-Tickets.md](docs/Web-App-Implementation-Tickets.md)
- [docs/Web-App-Sprint-Backlog.md](docs/Web-App-Sprint-Backlog.md)

Then continue Sprint 1:
- add the first real auth endpoint in the Nest backend
- add a current-session endpoint
- wire the frontend sign-in page to the backend
- protect the app shell and dashboard routes
- keep pnpm as the package manager
- update [status.md](status.md) and [ROADMAP.md](ROADMAP.md) with progress
- validate with lint, tests, and build

Continue Spark Gym ERP from [status.md](status.md) and start Sprint 1 auth work. Read the planning docs, keep using pnpm, wire frontend sign-in to backend auth/current-session endpoints, protect dashboard access, and update status.md as you go.