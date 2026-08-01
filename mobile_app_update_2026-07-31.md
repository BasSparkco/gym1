# Mobile App — Sign-In Contract Change + Release Checklist (2026-07-31)

Great news that the app is ready. One backend change landed today that affects the
sign-in screen, plus a short checklist below so we can call it done together.

---

## 1. Sign-in is now PHONE-ONLY (action needed)

The platform is about to host more than one gym, and member numbers repeat across gyms
(every gym has an `MEM-0001`), so they can't identify an account anymore.

**What changed in `POST /api/member-auth/sign-in`:**

- `identifier` must now be the member's **phone number**, in either form:
  - **local**, e.g. `0500000001` — no country code needed; the member's gym branch
    country is implied server-side. This is the form to encourage in the UI, since
    it's how people actually type their own number.
  - **international E.164**, e.g. `+972500000001` (spaces/dashes are fine, they're
    normalized server-side). A member whose registered phone has a *different*
    country code than their gym's country must use this form.
- Member numbers (`MEM-0013` style) are **no longer accepted** as an identifier.
- Everything else is unchanged: same endpoint, same `{ identifier, pin }` body, same
  `{ token, member }` response, same bearer-token usage on all `/me/*` calls.

**What to change in the app:**

- If the sign-in screen says "member number or phone", make it **phone + PIN only**
  (label, hint text, keyboard type `phone`, and any validation).
- If you hardcoded `MEM-0013` anywhere in dev/test config, switch it to the phone below.

**Updated test credentials** (same test account, same PIN):

```bash
curl -X POST https://gym.sparkco.vip/api/member-auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"+972500000001","pin":"246800"}'

# After the multi-tenant release deploys, the local form works too
# (the test account's branch country is IL/+972):
curl -X POST https://gym.sparkco.vip/api/member-auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"0500000001","pin":"246800"}'
```

**Timing: this is live NOW** (deployed 2026-07-31). Both phone forms work against
production — the curl commands above are directly runnable — and the member-number
path already returns 401. If the app currently signs in with `MEM-0013`, it is broken
against production as of today; switch it to phone.

---

## 2. Release checklist — please confirm each point

So we can verify "ready" end-to-end, please confirm (a short yes/no per line is enough):

**Auth & session**
- [ ] Sign-in screen is phone + PIN only (after the change above); phone field accepts
      both `05...` local and `+9725...` international input and passes it through as
      typed (no client-side reformatting needed — the server normalizes)
- [ ] Token stored locally; `GET /api/member-auth/current-session` is called on app
      launch to validate it, with a redirect to sign-in on 401
- [ ] Any 401 on a `/me/*` call clears the stored token and returns to sign-in
      (tokens expire after 30 days, and sign-out on another device revokes them)
- [ ] Sign-out calls `POST /api/member-auth/sign-out` and clears local state
- [ ] Wrong PIN shows a friendly error; note sign-in is rate-limited (10/min per IP),
      so a 429 should show "too many attempts, try again in a minute" — not a crash

**Screens**
- [ ] Home: membership card renders from `GET /me/memberships` (plan name, end date,
      status badge), including the empty state (member with no membership)
- [ ] QR: `GET /me/qrcode` renders full-screen and works offline-ish (cached last image)
- [ ] Announcements: `GET /me/announcements` list + empty state
- [ ] Closed dates: `GET /me/closed-dates` calendar + empty state
- [ ] Profile: photo, name, phone, member number (member number is fine to *display* —
      it's just no longer used to sign in)

**Push (can't be fully done yet — just confirm the wiring)**
- [ ] App requests an FCM token and sends it via `POST /me/device-token` with
      `{ token, platform: "android" }` after sign-in, and again on FCM token refresh
- [ ] Note: pushes won't reach devices yet — there's no Firebase project on our side
      yet. Send us the **applicationId / package name** you used so we can create the
      Firebase project and send you the matching `google-services.json`.

**Hand-off**
- [ ] Send a debug APK (or repo access) so we can run it against the test account
- [ ] Play Store: do you have the signed AAB, screenshots, and a privacy policy URL
      ready? (The $25 developer account — tell us if we should create it on our side.)

---

## 3. What's coming next (no action yet, just heads-up)

- The gym will soon onboard as a real tenant alongside the demo gym. Nothing changes in
  the app's API contract for that — phone-only sign-in is exactly what makes it safe.
- Once the Firebase project exists, real push delivery is a backend-side switch — no app
  changes beyond the `google-services.json` you'll get from us.
