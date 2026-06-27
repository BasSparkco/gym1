# BAS-IP Integration Plan

## What is BAS-IP

BAS-IP (bas-ip.com) is a UK-designed, EU-assembled manufacturer of IP intercom and access control systems. Their product range includes:
- IP door entry panels and video intercoms
- RFID/Mifare card readers
- Door controllers (CE-44 series)
- Smart gate and turnstile controllers
- Link Platform cloud software

They have a public developer portal with REST APIs for all their devices.

**Developer portal:** https://developers.bas-ip.com/
**Integrations page:** https://bas-ip.com/integrations/

---

## Customer's Device

The gym customer is using a **BAS-IP AV-03BD** — an individual entrance panel (video door station with built-in access controller and RFID reader).

**API category:** AV-03BD falls under the **Camdroid Panels** category in the BAS-IP developer portal.
- Developer docs: https://developers.bas-ip.com/category/camdroid-panels/
- Firmware API version: v1.x.x (Camdroid series)

**API compatibility:** The Remote Access Server protocol is **identical** across Camdroid Panels and Android Panels. The hardware provider's claim that all BAS-IP devices share the same API is accurate *for this specific feature*, even though different device families have different overall APIs.

---

## Integration Model

**Model A — BAS-IP calls GYM (real-time validation) — implemented ✅**

```
Member taps RFID card (or QR / keypad code)
        ↓
BAS-IP panel POSTs identifier to GYM API (Remote Access Server)
        ↓
GYM validates: is this identifier known? is membership active today?
        ↓
GYM responds: { "handled": true, "access": { "granted": true,  "lock_number": 1 } }
           or { "handled": true, "access": { "granted": false } }
        ↓
BAS-IP opens or keeps the gate locked (10-second timeout; falls back to local list)
```

---

## Verified API Contract (from developers.bas-ip.com)

### Device → GYM (inbound request)

The BAS-IP panel POSTs to the configured `custom_server_api_url` on every identifier scan:

```http
POST https://<gym-domain>/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>
Content-Type: application/json

{
  "identifier_number": "A3F20C1D",
  "identifier_type": "card"
}
```

`identifier_type` values:
| Value | Source |
|-------|--------|
| `card` | RFID / Mifare tap |
| `qr` | QR code scan |
| `input_code` | Keypad PIN entry |

**No auth headers are supported** — the BAS-IP firmware only allows configuring a URL. The secret is embedded as a `?token=` query parameter.

### GYM → Device (response)

HTTP status is always **200**. The panel reads the JSON body:

```json
// Access granted — open lock 1
{ "handled": true, "access": { "granted": true, "lock_number": 1 } }

// Access denied
{ "handled": true, "access": { "granted": false } }

// Delegate to device's local access list (not currently used)
{ "handled": false }
```

`lock_number`: `0` = both locks, `1`–`8` = specific lock. Default: `1`.

**Timeout:** The panel waits **10 seconds** for a response. If no response arrives, it handles access locally using its stored access list.

---

## What Was Built

### Backend — `apps/api/src/modules/access/`

| File | Purpose |
|------|---------|
| `access.service.ts` | Core business logic — hardware-agnostic. Accepts `(identifierNumber, identifierType, branchId)`, resolves member, validates membership, logs visit |
| `adapters/bas-ip.guard.ts` | Validates `?token=` query param against `DEVICE_TOKEN` env var |
| `adapters/bas-ip.controller.ts` | BAS-IP adapter: translates real BAS-IP payload → `AccessService` → BAS-IP response format |
| `access.module.ts` | NestJS module registration |

**Endpoint:** `POST /api/access/bas-ip?branchId=<id>&token=<DEVICE_TOKEN>`

**Identifier type handling:**
- `card` → lookup member by `rfidTag` (RFID card) → logged as `accessMethod: "rfid"`
- `qr` → lookup member by UUID or member number → logged as `accessMethod: "qr"`
- `input_code` → lookup member by member number → logged as `accessMethod: "qr"`

### Frontend — `apps/web/src/`

| Change | Detail |
|--------|--------|
| RFID tag field in member create/edit forms | Text input under "Access Control" section |
| RFID tag display on member profile | Violet chip badge showing the stored tag ID |
| `rfid` badge in visits list | Violet badge alongside existing QR/manual badges |

---

## Device Configuration (to be done by customer / installer)

Once the GYM API is live at a public domain with SSL:

1. Log in to the BAS-IP panel web UI (typically `http://<device-local-ip>`)
2. Navigate to: **Settings → Access → Remote Access Server**
3. Enable: **Custom server**
4. Set **Custom server URL** to:
   ```
   https://<gym-domain>/api/access/bas-ip?branchId=<branchId>&token=<DEVICE_TOKEN>
   ```
   Replace:
   - `<gym-domain>` — the production API domain
   - `<branchId>` — the branch ID from the GYM admin panel (e.g. `Platinum Fitness`)
   - `<DEVICE_TOKEN>` — the secret from `apps/api/.env`

5. Assign RFID tag IDs to members via the GYM web app: Member profile → Edit → Access Control section

---

## Adding a Second Hardware Vendor

The `AccessService` is hardware-agnostic. Adding a new vendor requires only:
1. A new guard (auth validation for that vendor's auth mechanism)
2. A new controller action (translate that vendor's payload → `AccessService` → that vendor's response format)

Example for a future ZKTeco integration:
```
apps/api/src/modules/access/adapters/
  bas-ip.guard.ts        ← existing
  bas-ip.controller.ts   ← existing
  zkteco.guard.ts        ← new: validates ZKTeco's auth scheme
  zkteco.controller.ts   ← new: translates ZKTeco payload/response
```

Zero changes to `AccessService` or any other module.

---

## Open Items

1. **Domain + SSL** — the device requires a publicly reachable HTTPS endpoint. Needs a production deployment with a real domain before hardware can be configured.
2. **Set a real `DEVICE_TOKEN`** — replace the placeholder in `apps/api/.env` with a long random string before connecting hardware.
3. **RFID card format** — assign tag IDs to members in the GYM web app. Tag IDs are stored uppercase; the service normalises on lookup.
4. **Offline fallback** — if the GYM server is unreachable, the panel falls back to its local card list (10 s timeout). Ensure the panel's local list matches active members for resilience.
