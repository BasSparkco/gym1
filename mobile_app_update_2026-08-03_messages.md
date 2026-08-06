# Mobile App — New Feature: Messages (Contact Us) (2026-08-03)

New backend feature for the app: a two-way messaging thread between staff and a member,
plus a way for staff to send a one-off push straight to a member from their profile. Both
are live now on the staff (web) side; this doc covers what the Android app needs to add.

---

## 1. Messages — new two-way thread (action needed, new screen)

Unlike Announcements (broadcast, one-way) or push notifications (one-way alert), Messages
is a real back-and-forth: staff can message a member from the ERP, the member replies from
the app, staff replies again, etc. Staff now have a "Contact Us" inbox in the web app
listing every member conversation with an unread count; the app needs the member side of
that same conversation.

**New endpoints** (all bearer-token, same auth as every other `/me/*` route):

- `GET /me/messages` → `{ messages: [{ id, senderType: "staff" | "member", body, createdAt, readByMemberAt }] }`,
  oldest first. Calling this **marks every unread staff message as read** as a side
  effect (no separate "mark read" call needed) — call it whenever the member opens the
  Messages screen.
- `POST /me/messages` → body `{ body: string }` → `201 { message: {...} }`. Sends a
  message from the member to staff.
- `GET /me/messages/unread-count` → `{ unreadCount: number }` — messages from staff the
  member hasn't read yet. Use this for a badge on the nav icon without opening the full
  thread (e.g. on a polling timer or on app resume).

**Suggested screen**: a simple chat thread — staff messages on one side, the member's own
on the other, a text field + send button at the bottom, matching the existing style used
elsewhere in the app. There's no push-triggered refresh yet (see below), so refresh on
screen focus / pull-to-refresh, plus polling while the screen is open, is the right
pattern for now — same as how Announcements and Closed Dates already work before real
push existed.

**Not push-notified yet**: sending a staff message does **not** trigger a device push (no
`Notification`/FCM row is created for it). If that's wanted for v2, flag it back to
us — for now the expectation is the member checks the Messages screen in-app, the same
way they already check Announcements.

---

## 2. One-off push notifications — already covered by an endpoint you may not have wired up

This isn't new plumbing, but it's newly *used*: staff can now send a free-text push to one
member's profile ("Send notification" button), which lands as an `app`-channel
`Notification`. There's a member-facing read endpoint for these that already existed in
the backend but wasn't in the original API reference doc — worth adding to the app if it
isn't there yet:

- `GET /me/notifications` → `{ notifications: [{ id, event, subject, body, createdAt }] }`,
  newest first — only `sent` app-channel notifications (the delivered one-off pushes and
  any future event-triggered `app`-channel notifications). This is separate from
  `GET /me/announcements` (tenant-wide broadcasts) — different model, different list.

**Push delivery is still not live** (same as noted in the original roadmap doc) — no
Firebase project exists yet, so `FcmNotificationProvider` still just logs server-side.
Once Firebase is connected this starts reaching real devices automatically, no app change
needed beyond what's already planned (FCM token registration via `POST /me/device-token`).
Until then, `GET /me/notifications` is the pull-based fallback, exactly like
`GET /me/announcements` already is.

---

## 3. Suggested nav

A single "Messages" (or "Contact Us") entry with an unread badge sourced from
`GET /me/messages/unread-count` covers this feature. If you'd rather combine it with the
existing Announcements/Notifications screens into one inbox-style tab, that's a UI call on
your side — the three backend resources (`announcements`, `notifications`, `messages`)
stay independent either way.

No sign-in or auth changes this time — everything above uses the same bearer token as
every other `/me/*` call.
