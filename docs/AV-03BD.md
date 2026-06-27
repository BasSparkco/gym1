# BAS-IP AV-03BD — What It Does and How We Connect It

## The Goal

When a registered gym member arrives at the entrance, the door should open
automatically — no staff involvement needed. The BAS-IP AV-03BD is the
physical device mounted at the entrance that makes this happen. Our job is to
connect it to the gym software so it can ask us "should this person get in?"
and act on the answer.

---

## The Device: AV-03BD

The AV-03BD is an entrance panel (the box on the wall at the door). It has:

- A built-in **RFID / Mifare card reader** — tap an access card or key fob
- A **QR code scanner** — scan a QR code from a phone or printed card
- A **keypad** — type a member number manually
- A **relay output** — an electrical signal that opens the electric door lock
  or gate when the device decides to grant access

The device can work in two modes:

1. **Offline (local list)** — it stores a list of allowed card IDs internally
   and makes its own decision. No internet needed, but the list must be
   manually updated every time a membership changes.

2. **Online (remote access server)** — for every tap/scan/code, it calls a URL
   you configure and asks in real time: "should I let this person in?" The
   server replies yes or no. This is what we implemented.

We implemented option 2 because the gym software already knows exactly who has
an active membership today. The device just asks us and we answer instantly.

---

## What Happens When a Member Arrives — Step by Step

```
1. Member taps RFID card on the panel
         ↓
2. AV-03BD sends a request to our API (within milliseconds)
         ↓
3. Our API looks up the identifier:
      - Is this card/QR assigned to a known member?
      - Is that member's account active?
      - Does that member have a membership that covers today's date?
      - Is the member already checked in (double-entry protection)?
         ↓
4a. All checks pass → API replies: "granted"
      → AV-03BD opens the door lock
      → Visit is recorded automatically in the gym software
         ↓
4b. Any check fails → API replies: "denied"
      → Door stays locked
      → No visit is recorded
```

The device waits up to **10 seconds** for our reply. If we don't respond in
time (e.g. server is down), it falls back to its own local card list.

---

## The Three Ways to Identify Yourself

| How you present yourself | Device reads it as | We look you up by |
|---|---|---|
| Tap RFID card / key fob | `identifier_type: "card"` | Your RFID tag stored in your member profile |
| Scan a QR code | `identifier_type: "qr"` | Your member UUID or member number encoded in the QR |
| Type on the keypad | `identifier_type: "input_code"` | Your member number (e.g. `MEM-0003`) |

All three paths go through the same check — only the lookup method differs.

---

## What the Device Sends Us (the Request)

Every time someone presents an identifier, the AV-03BD calls our API like this:

```
POST https://gym.sparkco.vip/api/access/bas-ip?branchId=Platinum Fitness&token=SECRET
Content-Type: application/json

{
  "identifier_number": "A3F20C1D",
  "identifier_type": "card"
}
```

- `identifier_number` — the raw value (RFID hex ID, QR content, or typed code)
- `identifier_type` — how it was read (`card`, `qr`, or `input_code`)
- `branchId` — which branch/entrance this device is at (in the URL)
- `token` — a secret that proves the request came from our device, not a
  stranger (in the URL, because BAS-IP firmware does not support custom headers)

---

## What We Reply

```json
// Let them in:
{ "handled": true, "access": { "granted": true, "lock_number": 1 } }

// Keep the door locked:
{ "handled": true, "access": { "granted": false } }
```

`lock_number: 1` tells the device which relay to trigger. We always use relay
1 (the main door lock). The HTTP status code is always **200** — the device
reads the JSON body, not the status code.

---

## What We Built in the Codebase

### The API endpoint

```
POST /api/access/bas-ip?branchId=<id>&token=<DEVICE_TOKEN>
```

Three source files handle this:

**`bas-ip.guard.ts`** — Runs first. Checks that `?token=` in the URL matches
the `DEVICE_TOKEN` value in the server's environment variables. If the token is
wrong or missing, replies 401 immediately. This is our only security layer
(the device cannot send HTTP headers, so the secret must live in the URL).

**`bas-ip.controller.ts`** — Receives the BAS-IP request format, validates the
fields, calls the core service, and translates the result back into the
BAS-IP response format. It is the adapter between BAS-IP's protocol and our
internal logic.

**`access.service.ts`** — The actual business logic. It does not know or care
that BAS-IP sent the request. It just receives `(identifierNumber,
identifierType, branchId)` and:
1. Confirms the branch exists
2. Finds the member by their identifier (RFID tag, QR/member number)
3. Checks the member's account is active
4. Checks there is an active membership covering today's date
5. Checks the member is not already checked in today (double-entry guard)
6. If all pass: creates a visit record and returns `granted: true`
7. If any fail: returns `granted: false` with a reason

Because the business logic (`access.service.ts`) is separate from the BAS-IP
adapter (`bas-ip.controller.ts`), adding a second brand of access device in the
future only requires writing a new adapter — the logic stays unchanged.

### RFID tag storage

Each member record has an optional `rfidTag` field. The gym admin enters the
card's hex ID (printed on the card, e.g. `A3F20C1D`) in the member's edit
form under the "Access Control" section. Tags are stored in uppercase;
the service normalises on lookup so casing on the card doesn't matter.

### Automatic visit logging

When the door is granted, `access.service.ts` immediately writes a visit
record to the store with:
- the member's ID
- the branch ID
- the current timestamp as `checkInTime`
- `accessMethod: "rfid"` (for card tap) or `"qr"` (for QR/keypad)

The visit appears in the gym's Visits list and in today's check-in count on
the dashboard — no manual staff action needed.

---

## What Still Needs to Be Done Before the Hardware Works

1. **Configure the device** — log into the AV-03BD web UI, go to
   Settings → Access → Remote Access Server, enable "Custom server", and paste
   the URL:
   ```
   https://gym.sparkco.vip/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>
   ```
   `<DEVICE_TOKEN>` comes from `apps/api/.env` on the server.

2. **Assign RFID tags to members** — each member who will use a physical card
   needs their card's hex ID entered in the gym web app:
   Member profile → Edit → Access Control → RFID Tag field.

3. **That's it.** Once the URL is configured and tags are assigned, the door
   will start opening automatically for members with active memberships.

---

## What Happens If Our Server Is Down

The AV-03BD waits up to 10 seconds. If no response arrives, it falls back to
its own **local stored list**. As long as that list is kept populated with
known card IDs, members can still enter offline. The device can maintain its
own list in parallel with the online integration.
