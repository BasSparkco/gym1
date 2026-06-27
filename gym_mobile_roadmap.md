# Spark Gym — Member Mobile App Roadmap

## Project Context

This mobile app is the member-facing companion to the Spark Gym ERP system.
The backend it connects to lives at: `/opt/sites/gym`
API base: `https://gym.sparkco.vip/api`

The ERP already handles members, memberships, QR access, notifications, and payments.
This app exposes a read-only member view on top of that existing backend — no separate backend needed.

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
- Member enters phone number or member number + PIN/password
- Backend validates against existing member records
- Session stored locally with DataStore

### 2. Home / Dashboard
- Gym logo and name at the top
- Member photo and full name
- Current membership: plan name, expiry date, status badge (Active / Expired / Frozen)
- Quick link button: **Show QR Code**
- Announcements feed (latest 3, link to full list)

### 3. QR Code Screen
- Full-screen QR code image fetched from:
  `GET /api/members/:id/qrcode` (session-authenticated)
- Member name below the QR
- "Save to Gallery" button

### 4. Closed Dates Calendar
- Monthly calendar view
- Gym-marked closed dates highlighted in red
- Tapping a date shows the closure reason (holiday, maintenance, etc.)
- Data comes from a new backend endpoint: `GET /api/branches/:id/closed-dates`

### 5. Announcements
- List of gym announcements (title, body, date)
- Push notification opens the relevant announcement
- Data from a new backend endpoint: `GET /api/announcements`

### 6. Profile
- Member photo (tap to view full size)
- Name, phone, email, member number
- Membership history list

---

## Backend Changes Needed

The existing gym backend at `/opt/sites/gym/apps/api` needs two small additions:

| Feature | New Endpoint |
|---|---|
| Closed dates | `GET/POST/DELETE /branches/:id/closed-dates` |
| Announcements | `GET/POST /announcements` (tenant-scoped) |
| Push token registration | `POST /members/:id/device-token` |
| Send push notification | Internal call to FCM when announcement is created |

Everything else (member profile, QR code, membership) already has working endpoints.

---

## Development Phases

### Phase 1 — Core (Android)
- Project setup (Android Studio, Kotlin, Jetpack Compose)
- Sign-in screen wired to gym backend
- Home screen: gym name, member photo, membership status
- QR code screen
- Estimated: 1 week

### Phase 2 — Notifications + Calendar
- Firebase FCM integration
- Backend: store device tokens, send push on announcement
- Announcements screen
- Closed dates calendar (requires backend addition)
- Estimated: 1 week

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
- Member authentication for the app should use a separate PIN or the existing password — do not expose the staff login flow to members.
- The QR endpoint (`/members/:id/qrcode`) is session-protected. The app must send the session cookie or switch to a token-based auth (JWT) for mobile clients.
- All API calls should go through HTTPS only (`https://gym.sparkco.vip/api`).
