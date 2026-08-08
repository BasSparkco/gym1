# Mobile App Update — Wire up "Interested" on the Explore tab (2026-08-08)

Follow-up to the Explore tab endpoints (`GET /me/courses`, `GET /me/plans`) you already
integrated. This one's small: the "Interested" button currently does nothing on our
side — it needs to call a new endpoint so staff can actually see it.

## What's changing

When the Explore tab spec was written, tapping "Interested"/"Subscribe" on a course was
deliberately local-only — just a UI confirmation, no backend call. That's no longer
true: staff asked to actually see which members are interested in a course, so we added
a real endpoint for it.

**This is a soft lead, not a real enrollment.** It does not charge the member, does not
book them into any class, and does not create debt — it's just a signal that shows up
on the course's staff page so front desk/owner can follow up. Actual enrollment (the
existing staff-side "Register a student" flow) is unchanged and still separate.

## New endpoint

```
POST /api/me/courses/:programId/interest
Authorization: Bearer <member token>   (same auth as every other /me/* route)
```

- `programId` — the `id` field from the course objects returned by `GET /me/courses`.
- No request body.
- Response: `204 No Content` on success.
- Safe to call more than once for the same course/member — it's an upsert, so a member
  tapping "Interested" twice does not create duplicate records or error. You don't need
  to track "already tapped" state client-side to avoid double-calls, though you're
  welcome to disable/grey the button after a successful tap for UX clarity.
- `401` if the bearer token is missing/invalid (same as the other `/me/*` routes).
- `404` if `programId` doesn't exist or doesn't belong to the member's tenant.

## What to change in the app

Wire the existing "Interested" button's tap handler to call this endpoint instead of
(or in addition to) the current local-only confirmation. Suggested UX: fire the request
when tapped, show your existing local "Interested" confirmation state immediately
(don't block the UI waiting on the network), and just let the call fail silently or
show a quiet retry/toast if it errors — this is a low-stakes signal, not a critical
transaction, so it shouldn't interrupt the browsing flow if the network hiccups.

## How to verify it worked

Ask Basel to check the course's page in the staff web app
(`/app/training-programs/<id>`) — there's a new "Interested members" section there
listing everyone who tapped it, with their name and the date. If your test taps aren't
showing up, first double check the request actually reached
`https://gym.sparkco.vip/api/me/courses/<id>/interest` (not a stale/cached local
build) and that it's a `POST`, not a `GET`.
