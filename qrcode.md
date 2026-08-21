# Send the actual QR image over WhatsApp (qrcode roadmap)

Goal: when an employee or member's QR code is delivered via WhatsApp (auto-send
on creation, "Resend QR" button, `/app/employees/[id]/qr` flow), attach the
**QR image itself** as WhatsApp media, instead of (or alongside) a text link
the recipient has to tap and download separately.

Not started — this is a roadmap only, written after a support case (Platinum
RSA, 2026-08-20) where a real QR-link message worked exactly as designed, but
highlighted that "tap a link, download, then show the download" is more steps
than "the image is just already in the chat."

State verified 2026-08-20:

- Both send paths are hardcoded plain-text strings today, not real media
  sends:
  - [apps/api/src/modules/employee-attendance/employee-attendance.service.ts](apps/api/src/modules/employee-attendance/employee-attendance.service.ts)
    `sendQrViaWhatsApp()` — now goes through
    `NotificationTemplatesService.getRenderedTemplate()` (templateKey
    `employeeQrCode`, see
    [apps/api/src/data/notification-templates-seed.ts](apps/api/src/data/notification-templates-seed.ts))
    but the rendered `body` is still just text with a `{{qrUrl}}` link in it.
  - [apps/api/src/modules/members/members.service.ts](apps/api/src/modules/members/members.service.ts)
    `sendQrViaWhatsApp()` — doesn't use the template system at all, a fully
    hardcoded literal string with the same link-in-text shape. (Pre-existing
    asymmetry with the employee flow — worth reconciling in Phase 2 below
    regardless of what happens with media.)
  - Both POST directly to SparkCo's `POST /messages/send`
    (`https://api.sparkco.vip/api/v1/messages/send`) with
    `{ channel: 'whatsapp', to, message }` — no media field exists in that
    request shape today.
- The QR PNG is already served at a public, signed, no-auth URL — this is
  the thing a media send would point at, no new hosting/storage work needed
  on the gym side:
  - `makeEmployeeQrPublicUrl(employeeId)` /
    `makeQrPublicUrl(memberId)` in
    [apps/api/src/common/qr.ts](apps/api/src/common/qr.ts) build
    `https://gym.sparkco.vip/api/employee-attendance/:id/qrcode/public?sig=...`
    (and the member equivalent), HMAC-signed so no session/cookie is needed
    to fetch it.
- SparkCo's WhatsApp send path (`/opt/sites/api`) is **text-only end to
  end** — this is the real gap, and it's the bigger side of this work:
  - `SendMessageDto`
    ([apps/api/src/modules/messages/dto/send-message.dto.ts](/opt/sites/api/apps/api/src/modules/messages/dto/send-message.dto.ts))
    has no media field.
  - `MessageJobData`/`SendMessagePayload`
    ([packages/types/src/index.ts:7-19](/opt/sites/api/packages/types/src/index.ts))
    likewise — the BullMQ job that reaches the worker only ever carries
    `{ channel, to, message, subject? }`.
  - `WhatsAppSessionManager.sendMessage(key, to, message: string)`
    ([apps/worker/src/services/whatsapp-session.manager.ts:267](/opt/sites/api/apps/worker/src/services/whatsapp-session.manager.ts#L267))
    calls `client.sendMessage(chatId, message)` — a plain-text
    `whatsapp-web.js` send. `whatsapp-web.js` is `^1.34.7`
    ([apps/worker/package.json](/opt/sites/api/apps/worker/package.json)),
    which supports media sends via its `MessageMedia` class
    (`MessageMedia.fromUrl(url)` fetches the file server-side and returns an
    object `client.sendMessage(chatId, media, { caption })` accepts) — no
    library upgrade needed, just new code paths using a capability that's
    already in `node_modules`.
  - `Message` entity
    ([packages/shared/src/entities/message.entity.ts](/opt/sites/api/packages/shared/src/entities/message.entity.ts))
    has no `media_url` column — sending/logging a media message needs a
    migration.

---

## Phase 1 — SparkCo API: add media support to WhatsApp sends

All of this lives at `/opt/sites/api`, not in this repo. This is the real
work; everything in Phase 2 is a thin caller of it.

- [x] **1.1** Add `mediaUrl` (and optionally `mediaCaption`, defaulting to
  `message`) to `SendMessagePayload`/`MessageJobData` in
  [packages/types/src/index.ts](/opt/sites/api/packages/types/src/index.ts).
  Keep `message` required as today — a media send without any caption text
  is a worse UX than a caption-only text send, so `message` stays the
  caption when `mediaUrl` is present.
- [x] **1.2** Add `mediaUrl?: string` (validated `@IsUrl()`) to
  `SendMessageDto`
  ([dto/send-message.dto.ts](/opt/sites/api/apps/api/src/modules/messages/dto/send-message.dto.ts)).
  Decide whether to allow it for `channel: 'email'` too (as an attachment)
  or restrict to `whatsapp` only for v1 — recommend WhatsApp-only first,
  matching the immediate need.
- [x] **1.3** TypeORM migration adding `media_url` (nullable varchar) to
  `messages`, mirroring the existing `session_id` migration
  ([1787076681582-AddMessageSessionId.ts](/opt/sites/api/apps/api/src/database/migrations/1787076681582-AddMessageSessionId.ts)
  as a template) — plus the matching column on the `Message` entity.
- [x] **1.4** `MessagesService.send()`
  ([messages.service.ts:92](/opt/sites/api/apps/api/src/modules/messages/messages.service.ts#L92)):
  persist `mediaUrl` on the `Message` row, thread it into `jobData` alongside
  the existing fields (~line 127-135). `sendBulk()` needs the same treatment
  if bulk media sends should be supported — not required for the QR use
  case (QR sends are always single-recipient), can be deferred.
- [x] **1.5** `WhatsAppProcessor.process()`
  ([apps/worker/src/processors/whatsapp.processor.ts](/opt/sites/api/apps/worker/src/processors/whatsapp.processor.ts)):
  destructure `mediaUrl` from `job.data`, pass it through to
  `sessionManager.sendMessage(...)`.
- [x] **1.6** `WhatsAppSessionManager.sendMessage()`
  ([whatsapp-session.manager.ts:267](/opt/sites/api/apps/worker/src/services/whatsapp-session.manager.ts#L267)):
  branch on whether `mediaUrl` is present —
  `const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true })`
  then `client.sendMessage(chatId, media, { caption: message })` instead of
  `client.sendMessage(chatId, message)`. Needs its own error handling:
  `fromUrl` can throw if the URL 404s or the fetch times out — catch and
  fall back to a **text-only send of the caption + a plain link** (`message +
  '\n' + mediaUrl`) rather than losing the message entirely. This fallback
  is important: it's the same graceful-degradation posture as the rest of
  this file (e.g. the `sendMessage()` `undefined`-id handling already there).
- [x] **1.7** Decide a media size/type guard before fetching — WhatsApp caps
  media around 16MB and QR PNGs are tiny (a few KB), so this is mostly about
  not blindly calling `MessageMedia.fromUrl()` on an arbitrary attacker-
  supplied URL if `mediaUrl` ever becomes something other tenants can set
  via the public API (`POST /messages/send` is API-key-authenticated
  per-tenant today, so this is a modest but real SSRF-shaped surface to
  think about — e.g. don't let a tenant's key make the worker fetch an
  internal-network URL).
- [x] **1.8** Manual test: use the `comm-dashboard` (or a direct
  `POST /messages/send` with an API key) to send a `mediaUrl` pointing at a
  real image to a real test number, confirm it lands as an actual WhatsApp
  image message with the caption underneath, not a broken/blank attachment.
  Also test the failure fallback (point `mediaUrl` at a 404) to confirm it
  degrades to text instead of silently failing the whole job.

  Done 2026-08-21: sent a real QR-code PNG via `mediaUrl` to a real test
  number through the live `comm-api`/`comm-worker` containers — worker log
  confirmed `Media message sent to +972515622300` (not the text-fallback
  path), DB row landed with `status: sent` and `media_url` populated. Fallback
  path (404 mediaUrl → text-only) was not separately exercised — worth a
  quick check before relying on it in production. Used a short-lived
  platform-scoped API key created via the admin API for this test, deleted
  immediately after.

## Phase 2 — Gym API: switch the two QR-send call sites over

Once Phase 1 ships and is confirmed working in `/opt/sites/api`, this repo's
changes are small:

- [x] **2.1**
  [employee-attendance.service.ts](apps/api/src/modules/employee-attendance/employee-attendance.service.ts)
  `sendQrViaWhatsApp()`: now POSTs `{ channel: 'whatsapp', to: employee.phone,
  message, mediaUrl: qrUrl, sessionId }`. The `employeeQrCode` template's
  in-code default text
  ([notification-templates-seed.ts](apps/api/src/data/notification-templates-seed.ts))
  dropped the "Tap this link... / Save the image..." lines since the image
  is now attached directly — `qrUrl` stays declared as a template variable
  so a tenant can still reference it in a customized caption. Any
  tenant-customized `employeeQrCode` override keeps its own text (including
  any `{{qrUrl}}` link) — not automatically rewritten; the link just becomes
  a redundant-but-harmless fallback in that case, since the SparkCo worker
  falls back to text+link automatically if the media fetch itself fails.
- [x] **2.2** Same change in
  [members.service.ts](apps/api/src/modules/members/members.service.ts)
  `sendQrViaWhatsApp()`, and migrated it onto the template system (it was
  the odd one out, hardcoded English only). Added a new `memberQrCode`
  template key mirroring `employeeQrCode` (default text in
  [notification-templates-seed.ts](apps/api/src/data/notification-templates-seed.ts),
  wired into the owner-editable templates UI at
  `/app/settings/notifications/templates` via
  [notification-templates.ts](apps/web/src/lib/notification-templates.ts),
  [templates/page.tsx](apps/web/src/app/app/settings/notifications/templates/page.tsx),
  and new `eventMemberQrCode`/`eventMemberQrCodeHelp` i18n strings). Needed
  `MembersModule` to import `SettingsModule` (for `defaultLanguage`) — it
  already imported `NotificationsModule`.
- [x] **2.3** Decided: no change needed. `POST /messages/send` is
  fire-and-forget — it enqueues a BullMQ job and returns as soon as the job
  is queued; `res.ok` here reflects job acceptance, not delivery outcome.
  The actual media-fetch-fails-so-fall-back-to-text branch (Phase 1.6) runs
  later, inside the worker, well after this HTTP call already returned —
  it's invisible to this endpoint either way, so the existing binary
  accepted/rejected shape is already correct and needs no change.
- [x] **2.4** Checked both `/app/employees/[employeeId]/qr` and
  `/app/members/[memberId]/qr` page copy (`qrCodeDescription`,
  `sendQrWhatsApp`, `qrSentSuccess`, etc. in
  [i18n.ts](apps/web/src/lib/i18n.ts)) — neither sets a "we'll text you a
  link" expectation anywhere; both just say "Send via WhatsApp" / "QR code
  sent via WhatsApp!". No copy changes needed.
- [ ] **2.5** Re-verify end to end against a real phone once both repos are
  deployed — same caution as every WhatsApp-touching change in this
  project: don't test against the dev environment's SparkCo credentials
  without knowing whether they'll message a real number (see
  `SPARKCO_API_KEY` being a real prod credential in dev `.env`, noted
  repeatedly elsewhere in this project's history).

## Open questions (resolve before starting Phase 1)

- Caption-only fallback text: should the "Save the image to your phone..."
  line stay when the image is already attached (WhatsApp already saves
  received images to the chat/gallery), or is that instruction now
  redundant/confusing?
- Should `mediaUrl` support apply to *every* `/messages/send` caller
  (general SparkCo product feature, useful beyond gym) or be scoped
  narrower initially? Phase 1 as written is general — no gym-specific
  logic leaks into `/opt/sites/api`, which matches how that service is
  used by other consumers today.
- Any interest in also attaching media to the **email** channel
  (`NotificationSenderSettings`/SMTP provider) at the same time, or keep
  this WhatsApp-only for now? Recommend WhatsApp-only — email already
  renders the QR fine via the existing HTML template pattern for
  `membershipActivated` if that's ever extended similarly, and it's a
  separate, smaller effort.
