# Notification Control Roadmap (NotiRoadmap)

Goal: give the tenant owner a real control surface for outgoing
notifications — edit the subject/body text per event, choose the language
it's sent in (the app already supports `en`/`ar`/`he`, see
[apps/web/src/lib/i18n.ts:4](apps/web/src/lib/i18n.ts#L4) and
`TenantSettings.defaultLanguage`/`enabledLanguages` at
[schema.prisma:652](apps/api/prisma/schema.prisma#L652)) — and let them turn
on new automatic triggers (starting with birthday messages) without a code
change per gym.

State verified 2026-08-01:

- `Notification` model
  ([schema.prisma:627](apps/api/prisma/schema.prisma#L627)) stores each sent
  message (`subject`, `body` as plain strings, `channel`, `event`, `status`).
  There is **no template table** — subject/body are hardcoded English
  literals written inline at each call site:
  [notifications.service.ts:150](apps/api/src/modules/notifications/notifications.service.ts#L150)
  (`membershipExpiring`/`membershipExpired`, inside
  `scanForExpiryNotifications`),
  [memberships.service.ts:122](apps/api/src/modules/memberships/memberships.service.ts#L122)
  and
  [memberships.service.ts:398](apps/api/src/modules/memberships/memberships.service.ts#L398)
  (`membershipActivated`), and
  [payments.service.ts:127](apps/api/src/modules/payments/payments.service.ts#L127)
  (`paymentPending`). `NotificationEvent` enum
  ([schema.prisma:92](apps/api/prisma/schema.prisma#L92)) has exactly these
  4 values — no `birthday` event exists.
- Owner-facing pages today:
  [apps/web/src/app/app/notifications/page.tsx](apps/web/src/app/app/notifications/page.tsx)
  (sent-notifications list) and
  [\[notificationId\]/page.tsx](apps/web/src/app/app/notifications/%5BnotificationId%5D/page.tsx)
  (detail) are **read-only**.
  [apps/web/src/app/app/settings/notifications/page.tsx](apps/web/src/app/app/settings/notifications/page.tsx)
  lets the owner toggle event/channel on-off and expiry lead-days, but not
  message content or language.
- Scheduling infra already exists:
  `@nestjs/schedule` cron job in
  [notifications-scheduler.service.ts](apps/api/src/modules/notifications/notifications-scheduler.service.ts)
  runs `scanForExpiryNotifications` daily — the pattern a birthday scan would
  follow.
- `Member` has no language field today — sending in the owner's chosen
  language means either a tenant-wide default (simplest) or a per-member
  language, decided in Phase 2.
- Multi-tenant scoping is standard throughout (`tenantId` on every query) —
  no new isolation work needed, just keep following the existing pattern.

---

## Phase 1 — Editable, storable templates (replace hardcoded English)

**Done and verified locally 2026-08-01** (41/41 e2e green; manually
walked the page with Playwright signed in as the demo owner — edit, save,
reset all round-tripped correctly against the dev DB).

- [x] **1.1** Added `NotificationTemplate` model
  ([schema.prisma](apps/api/prisma/schema.prisma), migration
  `20260801064104_add_notification_templates`): `tenantId`, `templateKey`,
  `lang`, `subject`, `body` (`@db.Text`), unique on
  `(tenantId, templateKey, lang)`. **Deviation from the original sketch:**
  used a free-form `templateKey` string instead of keying off
  `NotificationEvent` directly. Reason found while implementing: the
  `membershipActivated` event fires for two different messages — initial
  sale ("Welcome to Spark Gym...") and renewal ("Membership renewed...") —
  which need independently editable text but must stay one event for the
  Settings enable/channel toggle. `templateKey` adds a 5th key,
  `membershipRenewed`, that maps to the same event. Placeholders use
  `{{name}}` syntax, rendered by a plain string-replace helper (no
  templating engine).
- [x] **1.2** Default English text lives in code
  ([notification-templates-seed.ts](apps/api/src/data/notification-templates-seed.ts)),
  not a DB seed migration — simpler and it self-heals for tenants created
  later (a Phase 2.6-style hook wasn't needed). A tenant only gets a DB row
  once the owner actually edits something; until then behavior is
  byte-for-byte what was previously hardcoded.
- [x] **1.3** [NotificationTemplatesService](apps/api/src/modules/notifications/notification-templates.service.ts):
  `getRenderedTemplate(tenantId, templateKey, lang, variables)` — exact
  `(templateKey, lang)` override, else the tenant's `en` override, else the
  in-code default. `listTemplatesForTenant` / `upsertTemplate` /
  `resetTemplate` back the owner-facing page.
- [x] **1.4** Rewired all 5 call sites — the originally-listed 4 plus the
  renewal branch at
  [memberships.service.ts:398](apps/api/src/modules/memberships/memberships.service.ts#L398)
  that turned out to need its own `membershipRenewed` key (see 1.1) — to
  pass `{ templateKey, variables, relatedId }` instead of literal
  subject/body strings.
- [x] **1.5** New page
  [/app/settings/notifications/templates](apps/web/src/app/app/settings/notifications/templates/page.tsx):
  all 5 template keys × 3 languages, subject/body fields, placeholder
  hints, a "Customized"/"Using default text" badge, Save and Reset. Added
  a "Templates" pill to the shared settings sub-nav (branch/options/
  notifications/gates pages) so it's reachable. Backend:
  `GET/PUT/DELETE /notifications/templates[/:templateKey/:lang]`
  ([notification-templates.controller.ts](apps/api/src/modules/notifications/notification-templates.controller.ts)).
  **Bug caught during build:** this controller must be registered *before*
  `NotificationsController` in `notifications.module.ts` — its
  `GET /notifications/:notificationId` route would otherwise swallow
  `/notifications/templates` (Express matches in controller-registration
  order). Fixed and commented in the module file.
  **Known cosmetic quirk:** after Save, the redirect-to-self briefly shows
  the pre-edit "Using default text" badge until the next real navigation —
  Next.js client router cache on a same-URL redirect, same pattern already
  used by the sibling notifications-settings page. The saved text itself
  is correct immediately (verified via direct DB/API checks); a page
  refresh shows the updated badge too. Not worth a fix for Phase 1.

## Phase 2 — Language selection

**Turned out to already be done as a side effect of Phase 1** — found and
verified 2026-08-01, no new code needed.

- [x] **2.1** Decided: tenant-wide, not per-member — and it's what Phase
  1.3 already implemented (`getTenantDefaultLanguage` in
  [notifications.service.ts](apps/api/src/modules/notifications/notifications.service.ts)
  reads `TenantSettings.defaultLanguage` on every send).
- [x] **2.2** The owner UI already existed on both ends before this phase
  even started: `TenantSettings.defaultLanguage` is editable at
  [/app/settings/options](apps/web/src/app/app/settings/options/page.tsx)
  (pre-existing page, not part of this roadmap), and the Phase 1.5 templates
  page already shows English/Arabic/Hebrew as independent columns per
  template. Verified live end-to-end: added an Arabic `paymentPending`
  template via the API, switched the tenant's `defaultLanguage` to `ar`,
  created a real pending payment, and confirmed the resulting `Notification`
  row was sent with the Arabic subject/body and placeholders resolved
  (`150`, the real date) — then reverted the tenant back to `en` and deleted
  the test template/payment/notification.

## Phase 3 — Automatic triggers (birthday first)

**Done and verified locally 2026-08-01** (41/41 e2e green; live-tested the
full cycle against the dev DB: set a member's `dateOfBirth` to today,
enabled the event, ran the scan, confirmed the notification and its
rendered text, ran it again to confirm the dedupe, cleaned up after).

- [x] **3.1** Added `birthday` to the `NotificationEvent` enum (migration
  `20260801072115_add_birthday_notification_event`) and a matching
  `birthday` template key + English default in
  [notification-templates-seed.ts](apps/api/src/data/notification-templates-seed.ts)
  (`{{memberName}}` placeholder). `Member.dateOfBirth` already existed
  (nullable `@db.Date`, already used by the existing "upcoming birthdays"
  report) — no schema/UI work needed there.
- [x] **3.2** [notifications.service.ts](apps/api/src/modules/notifications/notifications.service.ts):
  `scanForBirthdays(tenantId)` finds members whose `dateOfBirth`
  month+day matches today, dedupes by checking for an existing `birthday`
  notification for that member since Jan 1 of the current year (not
  `relatedId` presence, since a birthday recurs annually and there's no
  membership/payment record to key off — `relatedId` is just the member's
  own id here). Wired into the existing
  [notifications-scheduler.service.ts](apps/api/src/modules/notifications/notifications-scheduler.service.ts)
  `EVERY_DAY_AT_7AM` cron, alongside `scanForExpiryNotifications`, each in
  its own try/catch so one tenant's failure doesn't block another's. Also
  added `POST /notifications/scan-birthdays` (owner/manager) mirroring the
  existing manual `/notifications/scan`, for on-demand testing/triggering.
- [x] **3.3** Added `birthday` to the `EVENTS` array on
  [settings/notifications/page.tsx](apps/web/src/app/app/settings/notifications/page.tsx) —
  it already builds its enable/channels UI generically per event, so this
  was a one-line addition plus labels. **Defaults to off**, unlike every
  other event (which default on): this is a brand-new automatic message
  type, and existing tenants shouldn't suddenly start messaging members
  without the owner opting in. Text is editable via the Phase 1.5 templates
  page, which already picks up new template keys automatically.
- [x] **3.4** Skipped, as planned — still only two scan jobs, not worth
  abstracting yet.

**Bug caught during manual verification (not from e2e — it doesn't cover
this):** `SettingsService.getSettingsForTenant`
([settings.service.ts](apps/api/src/modules/settings/settings.service.ts))
and `NotificationsService`'s own settings lookup both null-coalesced the
*entire* stored `notificationSettings` JSON blob against the defaults,
rather than merging per-key. Every tenant provisioned before `birthday`
existed has a stored blob that simply lacks that key, so
`settings.birthday.enabled` would throw for every real tenant the moment
this shipped — the bug wouldn't have shown up against a fresh e2e-seeded
tenant (which always gets the full current default shape), only against
already-live data, which is exactly what manual testing against the dev DB
caught. Fixed both spots to spread `defaults.notificationSettings` first,
stored blob second — same fix will silently protect the *next* new event
this pattern adds, too.

## Out of scope for now

Per-member language override, a general templating/placeholder engine beyond
simple string substitution, editable `enabledLanguages` list (4th+ language),
and additional automatic triggers beyond birthday (e.g. anniversary,
win-back) — revisit once birthday ships and the pattern is proven.
