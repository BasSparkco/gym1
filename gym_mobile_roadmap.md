  # Spark Gym — Member Mobile App Roadmap

*Last checked against the actual backend: 2026-07-31. Phase 0 (member auth) and the Phase 2*
*backend (Announcements, Closed Dates, push device-token storage) are all built. Real FCM*
*push delivery is NOT wired up yet — no Firebase project exists, so pushes currently just log*
*server-side instead of reaching a device (see "Push Notifications — Current State" below).*
*See "Getting Started", "Backend Changes Needed", and "API Reference for the Mobile Client"*
*below for the real, working contract to build the Android app against.*

> ⚠️ **Contract change (2026-07-31, multi-tenant readiness):** sign-in `identifier` is now
> the member's **phone number only** — member numbers (`MEM-0013` style) are **no longer
> accepted** as a sign-in identifier, because they repeat across gyms once the platform
> hosts more than one tenant. Two phone forms are accepted: **local** (`0500000001` — the
> country code is implied by the member's branch country, which is how people actually
> type their number) and **international** (`+972500000001` — required when the member's
> phone has a different country code than their branch). **Deployed to production
> 2026-07-31** — both phone forms are live and member numbers already return 401. If the app's sign-in screen offers "member
> number or phone", change it to phone-only. See `mobile_app_update_2026-07-31.md` for the
> exact hand-off notes sent to the app developer.

## Project Context

This mobile app is the member-facing companion to the Spark Gym ERP system.
The backend it connects to lives at: `/opt/sites/gym`
API base: `https://gym.sparkco.vip/api`

The ERP already handles members, memberships, QR access, notifications, and payments —
but all of that was, until 2026-07-20, **staff-facing only**, authenticated as a `User`
(employee/owner) account. A separate member-auth surface now exists (`/api/member-auth`,
`/api/me`) purpose-built for this app — see below for the endpoints and how PINs get
assigned.

---

## Getting Started (for an external Android developer)

Everything below is live against the real production API right now — no backend/repo
access is needed to start building. This is the **only** environment available (there is
no separate staging server), so a dedicated, clearly-fake test account was created for
development so real member data is never touched:

- **API base**: `https://gym.sparkco.vip/api`
- **Test sign-in phone**: `+972500000001`, or the local form `0500000001` (the test
  account's branch is in IL/+972 — the country code is implied)
- **Test PIN**: `246800`
- The account is `MEM-0013` (`fullName`: "ZZZ TEST - Mobile API Developer Account" —
  named that way so it's unmistakably a test fixture in any staff-facing screen, list, or
  report). The member number is display-only data now — it is **not** a sign-in identifier.
- This account has one active membership (monthly plan, `finalPrice` 150) so
  `GET /me/memberships` and the Home screen have real, non-empty data to render.

Try it directly:

```bash
curl -X POST https://gym.sparkco.vip/api/member-auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"+972500000001","pin":"246800"}'
# -> { "token": "...", "member": { ... } }

curl https://gym.sparkco.vip/api/me \
  -H 'Authorization: Bearer <token>'

curl https://gym.sparkco.vip/api/me/memberships \
  -H 'Authorization: Bearer <token>'

curl https://gym.sparkco.vip/api/me/qrcode \
  -H 'Authorization: Bearer <token>' -o qrcode.png
```

Do not repurpose this account for anything beyond development/testing, and don't create
additional test members without checking first — this is a live production tenant with
real gym members in it.

---

## Goal

Give gym members a branded mobile app where they can:
- See their profile and current membership
- Display their QR code at the gate
- Receive announcements and push alerts from the gym
- View a calendar of gym closed dates
- Stay connected to the gym brand

---

## Android — Recommended Stack

### Language

**Kotlin** — the official and modern Android language, backed by Google.
Safer and more concise than Java. All new Android development should use Kotlin.

Java is still supported but should be avoided for new projects.

### UI Framework

**Jetpack Compose** — Google's modern declarative UI toolkit for Android.
Write UI in Kotlin functions instead of XML layouts. Faster to build, easier to maintain.

### Key Libraries

| Purpose | Library |
|---|---|
| Networking (API calls) | Retrofit + OkHttp |
| JSON parsing | Gson or Moshi |
| Image loading (member photo) | Coil |
| QR code display | ZXing Android Embedded |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Local storage / session | DataStore (Jetpack) |
| Navigation between screens | Jetpack Navigation Compose |
| Calendar UI | Kizitonwose Calendar (compose-calendar) |
| Dependency injection | Hilt |

### Firebase Setup (for push notifications)

1. Create a Firebase project at console.firebase.google.com
2. Add the Android app with the package name (e.g. `com.sparkco.gymapp`)
3. Download `google-services.json` and place it in `app/`
4. Add FCM dependency: `com.google.firebase:firebase-messaging`
5. On sign-in, the app registers a device token and sends it to the gym backend
6. The backend stores the token per member and calls FCM when sending announcements

---

## App Screens — v1 Scope

### 1. Sign In
- Member enters **phone number** + 4–8 digit PIN
- `POST /api/member-auth/sign-in` with `{ identifier, pin }` → `{ token, member }`
  (401 on bad credentials). `identifier` is the member's **phone only**, in either form:
  - **local**, e.g. `0522223333` — the country code is implied by the member's branch
    country (most members' numbers share their gym's country, and nobody types `+972`);
  - **international E.164**, e.g. `+972522223333` (normalized server-side; spaces/dashes
    fine) — required when the member's registered phone has a **different** country code
    than their branch.
  **Changed 2026-07-31**: member numbers are no longer accepted — every gym has an
  `MEM-0001`, so they aren't unique once the platform hosts more than one gym.
- **There is no member self-service registration.** A member's PIN starts unset
  (`pinHash` is null) and sign-in fails until staff assigns one from the ERP via
  `POST /api/members/:memberId/pin` with `{ pin }` — e.g. handed out at the front desk
  when someone asks for the app. Since 2026-07-31 that endpoint also requires the member
  to have a phone number on file (it's the only sign-in identifier), and rejects a PIN
  that another member with the same phone already uses. Product/ops still needs to decide
  the actual handout flow (print it on the QR card? SMS it? read it aloud at the desk?).
- Store `token` locally with DataStore; send it as `Authorization: Bearer <token>` on
  every subsequent request. It's an opaque server-side session token (Redis-backed,
  30-day TTL), not a self-contained JWT — the upside is `POST /api/member-auth/sign-out`
  actually revokes it immediately, unlike a stateless JWT.

### 2. Home / Dashboard
- Gym logo and name at the top
- Member photo and full name
- Current membership: plan name, expiry date, status badge (Active / Expired / Frozen)
- Quick link button: **Show QR Code**
- Announcements feed (latest 3, link to full list)

### 3. QR Code Screen
- Full-screen QR code image: `GET /api/me/qrcode` with the member's bearer token,
  returns `image/png` directly (same QR content the gate scanner reads). This is a new
  member-scoped route — the ERP's own `GET /api/members/:id/qrcode` still exists but
  stays staff-session-only, unrelated to this.
- Member name below the QR
- "Save to Gallery" button

### 4. Closed Dates Calendar
- Monthly calendar view
- Gym-marked closed dates highlighted in red
- Tapping a date shows the closure reason (holiday, maintenance, etc.)
- ✅ **Backend done** (2026-07-26): `GET /api/me/closed-dates` (bearer-token) returns every
  upcoming closure that applies to the member — tenant-wide entries plus their own branch's
  — sorted ascending. Staff manage the calendar in the web app under Settings → Closed Dates.

### 5. Announcements
- List of gym announcements (title, body, date)
- Push notification opens the relevant announcement
- ✅ **Backend done** (2026-07-26): a new `Announcement` model, tenant-scoped and distinct
  from the existing per-member `Notification` model (which stays sms/whatsapp/email only —
  see "Push Notifications — Current State" below for why `push` was deliberately **not**
  added to `Notification`'s channel gating). `GET /api/me/announcements` (bearer-token)
  returns everything that applies to the member — tenant-wide plus their own branch — newest
  first. Staff create/delete announcements in the web app under Announcements; creating one
  immediately fans out a push attempt to every registered device (see below).

### 6. Profile
- Member photo (tap to view full size)
- Name, phone, email, member number
- Membership history list

### 7. Messages (Contact Us) — new, 2026-08-03
- A real two-way thread with staff, distinct from the one-way Announcements feed: staff
  message the member from the ERP's new "Contact Us" inbox, the member replies in-app,
  staff can reply again.
- ✅ **Backend done** (2026-08-03): new `Message` model, staff endpoints (conversations
  inbox + per-member thread, in the ERP), member endpoints `GET/POST /me/messages` +
  `GET /me/messages/unread-count` (see "API Reference" below).
- Still needed on the Android side: a chat-style thread screen + nav entry with an unread
  badge. See `mobile_app_update_2026-08-03_messages.md` for the full spec and suggested
  refresh pattern (no push trigger yet — poll/refresh-on-open, same as Announcements).
- Also newly relevant: `GET /me/notifications` (the member-facing read endpoint for
  one-off staff-sent pushes) existed in the backend but wasn't documented here until now —
  see "API Reference" below.

---

## Backend Changes Needed

| Feature | Work | Status |
|---|---|---|
| Member credentials | Hashed `pinHash` field on `Member` (migration `20260720214955_add_member_pin`) | ✅ **Done** (2026-07-20) |
| Member sign-in | `POST /api/member-auth/sign-in` — bearer token via Redis session, not a JWT (see Sign In screen notes) | ✅ **Done** |
| Staff assigns member PIN | `POST /api/members/:memberId/pin` (staff session, any role) | ✅ **Done** |
| Member "me" endpoints | `GET /api/me`, `GET /api/me/qrcode`, `GET /api/me/memberships` — all bearer-token-guarded | ✅ **Done** (memberships endpoint shipped 2026-07-26) — Home screen has everything it needs (plan name, price, start/end date, status) |
| Closed dates | `ClosedDate` model (tenant-scoped, optional `branchId` = tenant-wide), staff CRUD at `/closed-dates`, member read at `GET /me/closed-dates` | ✅ **Done** (2026-07-26) |
| Announcements | `Announcement` model (tenant-scoped, optional `branchId`, distinct from `Notification`), staff CRUD at `/announcements`, member read at `GET /me/announcements` | ✅ **Done** (2026-07-26) |
| Push token registration | `MemberDeviceToken` model, `POST /me/device-token` (bearer-token, upserts on member+token) | ✅ **Done** (2026-07-26) |
| Push notification channel | New `FcmNotificationProvider` (same pluggable-provider pattern as SMS/WhatsApp/email) fires on every `Announcement` creation, fanning out to every matching `MemberDeviceToken`. Deliberately **not** added to the existing `Notification`/`NotificationChannel` per-event gating pipeline — see "Push Notifications — Current State" below | ✅ **Plumbing done** (2026-07-26) — ⚠️ **not connected to real FCM yet**, see below |
| Tenant resolution at sign-in | Revisited 2026-07-31 for multi-tenant readiness: `identifier` is now **phone only** (memberNumber dropped — not unique across gyms), looked up without pre-selecting a tenant; the PIN is verified against every phone match, and PIN assignment refuses a phone+PIN pair already in use by another member anywhere, so a phone shared across two gyms stays unambiguous | ✅ **Done** (2026-07-31) |
| Two-way Messages | New `Message` model (distinct from the one-way `Notification`/`Announcement` models), staff CRUD + inbox in the ERP ("Contact Us"), member read/send at `GET/POST /me/messages` + unread count at `GET /me/messages/unread-count` | ✅ **Done** (2026-08-03) — Android screen still needed, see `mobile_app_update_2026-08-03_messages.md` |
| Staff-sent one-off push | `POST /members/:memberId/notifications` (staff, ERP-side) creates an `app`-channel `Notification` and dispatches it through the existing push pipeline; member reads history via `GET /me/notifications` (endpoint existed already, newly documented) | ✅ **Done** (2026-08-03) |

## Push Notifications — Current State

The full pipeline is built end-to-end — device-token storage, the `Announcement` model, and
a push-fan-out on every announcement — but it does **not reach a real device yet** because no
Firebase project exists. `FcmNotificationProvider` (`apps/api/src/modules/notifications/providers/fcm-notification.provider.ts`)
currently just **logs** each push attempt server-side and reports success, exactly the same
stand-in pattern already used for SMS/WhatsApp/email before their real credentials existed
(`ConsoleNotificationProvider`). `Announcement.pushSentCount`/`pushFailedCount` (visible to
staff on the Announcements page) reflect these stand-in sends, not real device deliveries.

**To go live**, once a Firebase project exists (see "Firebase Setup" above for the Android-side
steps): swap the body of `FcmNotificationProvider.send()` for a real `firebase-admin` HTTP v1
call, gated on an env var (e.g. `FCM_SERVICE_ACCOUNT_JSON`) the same way `SparkcoNotificationProvider`/`SmtpNotificationProvider`
are gated on their own credentials — no interface, call-site, schema, or Android-side change
needed. This is a same-file follow-up, not a redesign.

**On the Android side**: the app should call `POST /me/device-token` (body `{ token, platform }`,
`platform` = `"android"`) once it has an FCM token, and again whenever FCM issues a new one
(token-refresh callback) — the endpoint upserts on `(member, token)` so re-registering the same
device is a no-op refresh, not a duplicate.

## API Reference for the Mobile Client

All under `https://gym.sparkco.vip/api` (dev: `http://localhost:3002/api`).

- `POST /member-auth/sign-in` — body `{ identifier, pin }` → `200 { token, member: { id, tenantId, memberNumber, fullName } }`, or `401` on bad credentials. `identifier` = the member's **phone number only**, local form (`0522223333`, branch country implied) or E.164 (`+972522223333`, required when the phone's country differs from the branch's). Changed 2026-07-31 — member numbers are no longer accepted. Rate-limited (10/min/IP).
- `GET /member-auth/current-session` — `Authorization: Bearer <token>` → `200 { member }` or `401`. Useful to validate a stored token on app launch.
- `POST /member-auth/sign-out` — revokes the token, `204`.
- `GET /me` — full member profile + computed membership `status` (`active`/`inactive`).
- `GET /me/memberships` — `{ memberships: [{ id, planId, startDate, endDate, status, finalPrice, plan: { name, price, durationDays, ... } }] }`. Everything the Home screen needs for the membership card.
- `GET /me/qrcode` — `image/png`, the same QR the gate scanner reads.
- `GET /me/announcements` — `{ announcements: [{ id, branchId, title, body, pushSentCount, pushFailedCount, createdAt }] }`, tenant-wide plus the member's own branch, newest first.
- `GET /me/closed-dates` — `{ closedDates: [{ id, branchId, date, reason, createdAt }] }`, tenant-wide plus the member's own branch, upcoming only (`date >= today`), ascending.
- `POST /me/device-token` — body `{ token, platform? }` (`platform`: `"android"` | `"ios"`) → `204`. Call this once an FCM token is obtained, and again on token-refresh.
- `GET /me/notifications` — `{ notifications: [{ id, event, subject, body, createdAt }] }`, newest first. Only delivered (`sent`) `app`-channel `Notification` rows — staff-sent one-off pushes (see "Messages" below) plus any future event-triggered app notifications. Distinct from `GET /me/announcements` (tenant-wide broadcasts, different model).
- `GET /me/messages` — `{ messages: [{ id, senderType: "staff" | "member", body, createdAt, readByMemberAt }] }`, oldest first. **Marks every unread staff message as read as a side effect** — call it when the member opens the Messages screen, no separate mark-read call.
- `POST /me/messages` — body `{ body: string }` → `{ message: {...} }`. Sends a message from the member to staff.
- `GET /me/messages/unread-count` — `{ unreadCount: number }` — staff messages the member hasn't read yet, for a nav badge without opening the full thread.

Everything above requires `Authorization: Bearer <token>` except sign-in itself.

---

## Development Phases

### Phase 0 — Backend: Member Auth ✅ Done (2026-07-20, extended 2026-07-26)
- Hashed PIN field on `Member`, member sign-in + bearer-token sessions, `/me`,
  `/me/qrcode`, and `/me/memberships` routes, staff-side PIN assignment endpoint. See
  "API Reference" above and "Getting Started" for working test credentials.
- Not yet decided: how staff actually hand a PIN to a member (see Sign In screen notes)
  — settle this before Phase 1 sign-in UI, since it affects the copy on that screen.

### Phase 1 — Core (Android)
- Project setup (Android Studio, Kotlin, Jetpack Compose)
- Sign-in screen wired to `/api/member-auth/sign-in`
- Home screen: gym name, member photo, membership status
- QR code screen (against `/api/me/qrcode`)
- Estimated: 1 week

### Phase 2 — Notifications + Calendar
- Backend: ✅ **Done** (2026-07-26) — `Announcement` model + endpoints, `ClosedDate` model +
  endpoints, device-token storage, push fan-out on announcement creation. See "Backend Changes
  Needed" and "Push Notifications — Current State" above.
- Still needed on the Android side: Firebase project + `google-services.json` (see "Firebase
  Setup" above), register the FCM token via `POST /me/device-token`, Announcements screen,
  Closed dates calendar.
- Still needed on the backend side: swap `FcmNotificationProvider`'s stand-in for a real
  Firebase Admin SDK call once a Firebase project exists — see "Push Notifications — Current
  State" above.
- Estimated (Android UI + Firebase wiring only, backend no longer blocks this): 3–5 days

### Phase 3 — Polish + Play Store
- Gym branding (logo, colors, splash screen)
- Error states, loading skeletons, offline handling
- Google Play Store submission
  - One-time fee: $25
  - Requires: signed APK/AAB, store listing, screenshots, privacy policy
- Estimated: 3–5 days

---

## Later: Adding iOS Support

There are two paths to add iOS after the Android app is live:

### Option A — Kotlin Multiplatform Mobile (KMM) — Recommended

Write the business logic and API layer once in Kotlin, shared between Android and iOS.
Write the UI separately in:
- Kotlin + Jetpack Compose for Android (already done)
- Swift + SwiftUI for iOS

**Pros:** Shared networking, auth, and data layer. iOS UI feels native.
**Cons:** Requires learning Swift/SwiftUI for the iOS UI layer.
**Apple requirements:** Mac machine, Xcode, Apple Developer account ($99/year).

### Option B — React Native / Expo (Rewrite)

Rewrite the app using React Native (TypeScript), which produces both Android and iOS from one codebase.
The existing gym web app already uses TypeScript, so the team is familiar.

**Pros:** One codebase for both platforms. Faster to reach iOS parity.
**Cons:** Full rewrite of the Android app. React Native performance is slightly below native for complex UIs.
**Apple requirements:** Same — Mac, Xcode, Apple Developer account ($99/year).

### Recommendation

If the Android app grows complex or the team prefers native feel: **go KMM**.
If speed and one-codebase simplicity matter more: **go React Native from the start** (and skip the native Kotlin approach above entirely).

### Apple-Specific Requirements (regardless of option)

- A Mac running macOS (required to build iOS apps — no workaround)
- Xcode installed (free from the Mac App Store)
- Apple Developer Program membership: $99/year
- App Store Connect account for submission
- iOS push notifications use **Apple Push Notification service (APNs)** — Firebase FCM supports APNs as a backend so the same FCM setup works for both Android and iOS

---

## Notes

- The gym backend already sends WhatsApp and email notifications. Push notifications are additive — they do not replace those channels, they supplement them for members who install the app. Push isn't live yet (see "Push Notifications — Current State" above) — announcements still work and are visible in-app via `GET /me/announcements` even before real push delivery is wired up.
- Member authentication is PIN-based, entirely separate from staff login — see "API Reference for the Mobile Client" above for the live endpoints.
- A member can't sign in until staff assigns them a PIN (`POST /api/members/:memberId/pin`), and since 2026-07-31 they also need a phone number on file — it's the only sign-in identifier. There's no member self-service flow — decide the handout process (front desk, printed on a card, etc.) before finalizing the sign-in screen's copy.
- All API calls should go through HTTPS only (`https://gym.sparkco.vip/api`).
