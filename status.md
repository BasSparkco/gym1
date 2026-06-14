# Spark Gym ERP Status Log

This file is the daily progress log for the project.
Add the newest update at the top so the latest status is always visible first.

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