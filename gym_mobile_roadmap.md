# Spark Gym — Member Mobile App Roadmap

*Last checked against the actual backend: 2026-07-26. Phase 0 (member auth) is live, and*
*`GET /me/memberships` (needed for the Home screen) has now also shipped to production —*
*see "Getting Started", "Backend Changes Needed", and "API Reference for the Mobile Client"*
*below for the real, working contract to build the Android app against.*

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
- **Test member number**: `MEM-0013` (`fullName`: "ZZZ TEST - Mobile API Developer Account" —
  named that way so it's unmistakably a test fixture in any staff-facing screen, list, or report)
- **Test PIN**: `246800`
- This account has one active membership (monthly plan, `finalPrice` 150) so
  `GET /me/memberships` and the Home screen have real, non-empty data to render.

Try it directly:

```bash
curl -X POST https://gym.sparkco.vip/api/member-auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"MEM-0013","pin":"246800"}'
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
- Member enters phone number or member number + 4–8 digit PIN
- `POST /api/member-auth/sign-in` with `{ identifier, pin }` → `{ token, member }`
  (401 on bad credentials). `identifier` matches either `memberNumber` (case-insensitive)
  or `phone` (E.164, e.g. `+972522223333`).
- **There is no member self-service registration.** A member's PIN starts unset
  (`pinHash` is null) and sign-in fails until staff assigns one from the ERP via
  `POST /api/members/:memberId/pin` with `{ pin }` — e.g. handed out at the front desk
  when someone asks for the app. Product/ops still needs to decide the actual handout
  flow (print it on the QR card? SMS it? read it aloud at the desk?).
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
- No `ClosedDate` concept exists anywhere in the schema today — this needs a real
  Prisma model (tenant + branch scoped) and migration, not just an endpoint:
  `GET/POST/DELETE /api/branches/:id/closed-dates`

### 5. Announcements
- List of gym announcements (title, body, date)
- Push notification opens the relevant announcement
- There's an existing `Notification` model/module, but it's a different concept:
  per-member transactional messages (expiry/payment reminders) triggered by staff,
  sent over `sms | whatsapp | email` — there's no `push` channel and no tenant-wide
  broadcast concept. Announcements need their own model
  (tenant-scoped, not per-member) rather than reusing `Notification`:
  `GET/POST /api/announcements`

### 6. Profile
- Member photo (tap to view full size)
- Name, phone, email, member number
- Membership history list

---

## Backend Changes Needed

| Feature | Work | Status |
|---|---|---|
| Member credentials | Hashed `pinHash` field on `Member` (migration `20260720214955_add_member_pin`) | ✅ **Done** (2026-07-20) |
| Member sign-in | `POST /api/member-auth/sign-in` — bearer token via Redis session, not a JWT (see Sign In screen notes) | ✅ **Done** |
| Staff assigns member PIN | `POST /api/members/:memberId/pin` (staff session, any role) | ✅ **Done** |
| Member "me" endpoints | `GET /api/me`, `GET /api/me/qrcode`, `GET /api/me/memberships` — all bearer-token-guarded | ✅ **Done** (memberships endpoint shipped 2026-07-26) — Home screen has everything it needs (plan name, price, start/end date, status) |
| Closed dates | New `ClosedDate` model + migration, `GET/POST/DELETE /branches/:id/closed-dates` | **New** — not started |
| Announcements | New `Announcement` model + migration (tenant-scoped, distinct from `Notification`), `GET/POST /announcements` | **New** — not started |
| Push token registration | New field/table for FCM device tokens on `Member`, `POST /me/device-token` | **New** — not started |
| Push notification channel | Add `push` to the `NotificationChannel` enum (currently `sms \| whatsapp \| email` only) if announcements should reuse the existing dispatch pattern | **New** — not started |
| Tenant resolution at sign-in | Not a separate step — `identifier` (phone/memberNumber) is looked up without pre-selecting a tenant, same pattern staff sign-in already uses. Fine for now since there's one tenant in production; revisit if a second tenant is ever onboarded | ✅ **Decided/implemented** this way |

## API Reference for the Mobile Client

All under `https://gym.sparkco.vip/api` (dev: `http://localhost:3002/api`).

- `POST /member-auth/sign-in` — body `{ identifier, pin }` → `200 { token, member: { id, tenantId, memberNumber, fullName } }`, or `401` on bad credentials. Rate-limited (10/min/IP).
- `GET /member-auth/current-session` — `Authorization: Bearer <token>` → `200 { member }` or `401`. Useful to validate a stored token on app launch.
- `POST /member-auth/sign-out` — revokes the token, `204`.
- `GET /me` — full member profile + computed membership `status` (`active`/`inactive`).
- `GET /me/memberships` — `{ memberships: [{ id, planId, startDate, endDate, status, finalPrice, plan: { name, price, durationDays, ... } }] }`. Everything the Home screen needs for the membership card.
- `GET /me/qrcode` — `image/png`, the same QR the gate scanner reads.

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
- Backend: `Announcement` model + endpoints, `ClosedDate` model + endpoints
- Firebase FCM integration; backend: device token storage, `push` channel, send on announcement
- Announcements screen
- Closed dates calendar
- Estimated: 1.5–2 weeks (bigger than before — two new models/migrations, not just endpoints)

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

- The gym backend already sends WhatsApp and email notifications. Push notifications are additive — they do not replace those channels, they supplement them for members who install the app.
- Member authentication is PIN-based, entirely separate from staff login — see "API Reference for the Mobile Client" above for the live endpoints.
- A member can't sign in until staff assigns them a PIN (`POST /api/members/:memberId/pin`). There's no member self-service flow — decide the handout process (front desk, printed on a card, etc.) before finalizing the sign-in screen's copy.
- All API calls should go through HTTPS only (`https://gym.sparkco.vip/api`).
