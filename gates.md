# Gates / BAS-IP access control — notes (2026-09-09)

Working notes from fixing the Platinum RSA multi-gate QR issue. Kept here so
the next gate (new tenant, or a third Platinum RSA gate) doesn't hit the same
gaps.

## Do tomorrow: enable the custom server on both Platinum RSA gates

On each BAS-IP device: **Access management → Server manage access → enable →
enable "use custom server"**, then paste the URL for *that* device (they are
different — each has its own `branchId`/`gateId`):

- **Platinum Fitness gate** (`213.8.132.134:8081`):
  ```
  gym.sparkco.vip/api/access/bas-ip?branchId=branch-38e36b2c-39dc-4598-9a6f-b68106a3eae2&gateId=gate-d7975664-2bda-40f6-9a67-f1698e3dae04&token=<DEVICE_TOKEN>
  ```
- **Platinum Women gate** (`213.8.132.134:8082`):
  ```
  gym.sparkco.vip/api/access/bas-ip?branchId=branch-b7e80d36-e69c-4b86-afe9-433e96f8319b&gateId=gate-de72b639-aaec-4de7-9661-c0d5d46f1fbf&token=<DEVICE_TOKEN>

  ```

`token` is a single global secret (`DEVICE_TOKEN` env var on the API
container) shared by every gate/tenant, not per-device — same value goes on
both URLs above and on any future gate.

**What this does and doesn't change:** the device tries our server first on
every scan; if we don't answer within ~10s (or are unreachable) it falls back
to its own local identifier list — the thing that's working today. So this is
additive, not a cutover: doors that open now keep opening. What it adds is
real-time enforcement (active/frozen membership, gender-gate match, duplicate
check-in blocking) and — the actual point — it's the only thing that writes
`Visit`/`EmployeeVisit` rows, so attendance/check-in pages stay empty without
it regardless of how correct the local list is.

Recommend enabling one gate first (Fitness), confirm a test scan both opens
the door and shows up on the Visits page, then do the Women's gate.

## The bug fixed today (2026-09-09), for context

`BasIpSyncService.pushQrIdentifier` / `pushEmployeeQrIdentifier` take an
optional `gate` param — pass a gate, it pushes to that device; omit it, it
falls back to a single legacy device from `BASIP_DEVICE_URL` env (currently
the Platinum Fitness gate). Every call site used to omit it, so every
member's and employee's QR was *only ever* registered on one device,
regardless of their configured branch/gate scope. Concretely this meant:

- Employees with `gateAccessScope: organization` (should open every gate)
  only opened Fitness.
- Female members (gate gender-restricted) were being registered on the
  *men's* gate and not the women's gate at all — nothing in the local list
  enforces gender, only the real-time check does, and that's never run for
  this tenant (see above).

Fixed in [apps/api/src/modules/employee-attendance/employee-attendance.service.ts](apps/api/src/modules/employee-attendance/employee-attendance.service.ts)
(`setEmployeeGates`) and [apps/api/src/modules/memberships/memberships.service.ts](apps/api/src/modules/memberships/memberships.service.ts)
(`syncToDevice`/`pushToApplicableGates`) — both now resolve the actual set of
gates the person is entitled to (employee: `gateAccessScope` — branch /
organization / selected; member: plan's `allowAllBranches` /
`restrictToHomeBranch` / `MembershipPlanBranch`) and push to each, skipping
gender-mismatched gates. Committed as `e743823`, deployed.

This only takes effect on the *next* push (employee gate-access save,
membership create/renew/freeze) — it doesn't retroactively fix identifiers
already pushed under the old logic.

## Still open / deferred

- **Member resync**: the 15 employees were re-pushed to both devices and
  verified directly against the device API. The ~151 active Platinum RSA
  members have **not** been resynced yet — owner is updating the member list
  first, will ask for the resync once that's ready. Until then, existing
  members' local-list registration is still wrong (per the bug above).
- **Old local-list entries**: both devices have identifiers on them that
  don't obviously map to current members/employees (leftover from whatever
  app/process managed the device before, or old test pushes). Before any
  cleanup: list everything on both devices, push our current correct set
  first, diff what's left over, review that list with the owner, only then
  delete. Don't wipe blind — deleting an identifier immediately locks that
  person out physically, and it's not reversible from our side without
  knowing exactly what was removed. Owner asked about this 2026-09-09,
  agreed on this staged approach, not yet scheduled.
- `BasIpSyncService.lookupUidByLinkId` returns `uid: null` for every item on
  these two live devices — the device's `list_items` response doesn't include
  a `uid` field the way the code expects (or the `link_id` query filter
  doesn't narrow server-side; observed both devices return page-1 items
  regardless of the `link_id` param, though the `link_id` on the returned
  item did correctly match in spot checks). Doesn't currently break anything
  in use (employee/member QR images are generated locally via the `qrcode`
  package, not fetched from the device), but if `fetchQrPngFromDevice` is
  ever wired up to something real, this needs a proper look first.
- No revoke-on-cancel path: `BasIpSyncService.removeIdentifier` exists for
  members but nothing calls it — cancelling/deactivating a membership doesn't
  currently remove the identifier from any device's local list. Not touched
  as part of this work; worth a look before it matters.

## BAS-IP Link (2026-09-12): logging without the real-time latency

### Why

The owner asked for faster door-opening on the Platinum Fitness gate, so
**Access management → Server manage access → enable** got unchecked there
(2026-09-12), leaving **use custom server** checked underneath but inert —
`enable` is the master switch for the whole real-time flow. With it off the
device grants purely from its local list: instant door, but our server is
never called, so no `Visit` row and none of the real-time enforcement
(active membership, gender-gate, duplicate check-in) applies. Confirmed via
Traefik's raw access log (`docker`'s own `logs` command is broken on this
host — corrupted stream — read the container's
`*-json.log` file under `/var/lib/docker/containers/<id>/` directly instead)
that all three registered gates/branches went quiet at different times
(09:38 / 10:35 / 10:56 UTC that day), and a live synthetic POST to
`/api/access/bas-ip` confirmed the server side was never the problem.

Turning `enable` back on is one option (measured server response time was
15–55ms before it was disabled — the perceived slowness is almost certainly
the Cloudflare round-trip, not our processing) but the owner wants the
instant open. So instead we're using the device's **other**, independent
integration point:

### The other channel: Network → Management system

Distinct screen from Access management. Fields (confirmed via the device's
own API, `GET/PUT /api/v1/network/management/server`):

```json
{
  "is_enabled": true,
  "protocol": "http",
  "settings": {
    "url": "https://gym.sparkco.vip/api/access/bas-ip-link",
    "password": "<BASIP_LINK_PASSWORD in apps/api/.env>",
    "is_heartbeat_enabled": true,
    "is_logging_enabled": true
  }
}
```

UI labels: **URL**, **Password**, checkbox **"send realtime logs to
server"** (`is_logging_enabled`), and a second checkbox that's **"Heartbeat
to server"** when protocol is HTTP or **"Encrypted"** when protocol is MQTT
(`is_heartbeat_enabled`).

This is the device's own vendor-cloud channel — both gates came
pre-provisioned by the installer pointing at BAS-IP's own
`https://sip.bas-ip.com` (password <redacted — installer-provisioned, not ours>) with `is_enabled: false`.
That's useless to us (their cloud, not ours), so we repointed `url`/
`password` at our own receiver instead.

**Key property, per BAS-IP's docs:** the device decides access locally
first (fast), then reports the outcome to this URL afterward — if the URL
is unreachable it buffers and retries every minute rather than blocking the
door. This is exactly the "fast door + still get logged" behavior the
owner wants, decoupled from the real-time decision path above.

### Status: working, live in production (2026-09-12)

`BasIpLinkController` (`apps/api/src/modules/access/adapters/bas-ip-link.controller.ts`,
registered in `access.module.ts`) implements the real handshake and creates
`Visit`/`EmployeeVisit` rows from it. Confirmed end-to-end on **Platinum
Fitness (8081)**: a real member scan produced `visitsCreated=1` in the logs
and the Visit showed up in the app immediately. Enabled on **Platinum
Women's (8082)** too, not yet visit-confirmed there; employee-scan ->
`EmployeeVisit` also not yet confirmed with a real scan (code path is the
same as the member one, just untested live).

**Reverse-engineered handshake** (undocumented by BAS-IP for the HTTP
variant — no Content-Type header on most of these calls, so `main.ts` reads
the whole `/api/access/bas-ip-link` prefix as raw text and every handler
`JSON.parse`s it itself):

1. `POST /api/v0/devices/login` — body `{"login": "<serial_number>", "password": "<BASIP_LINK_PASSWORD>"}`.
   We check the password against `BASIP_LINK_PASSWORD` (`apps/api/.env`,
   value not repeated here) and 401 if it doesn't match. Look up the `Gate`
   by `linkDeviceSerial` (new column — set via that gate's edit page,
   "Link device serial" field, `/app/settings/gates/[gateId]`; this push
   carries no branchId/gateId of its own, unlike the real-time
   `bas-ip.controller.ts` callback, so this is the only way to attribute an
   event to a gate). Respond `{"token": "<uuid>"}` — an in-memory
   `Map<token, {gateId, branchId, tenantId}>` on the controller, no DB
   session table.
2. `PUT /api/v0/devices/logs` (`Authorization: Bearer <token>`) — body
   `{"events": [{created_at, category, code, info: {...}}, ...]}`. On first
   enable the device dumps its *entire* historical backlog this way, 100
   events per push, paging forward chronologically over many rapid
   login/logs cycles (took ~15 min to catch up from ~2 months of history on
   both gates) — expected once, not a bug. Event codes seen:
   `access_granted_by_valid_identifier` (has `info.number`/`code`/`card`
   — the identifier value — plus `info.type` (`qr`|`card`) and
   `info.owner`, the name string as configured on the device),
   `access_denied_by_unknown_qr`, `lock_was_opened_by_exit_btn`. Only
   `access_granted_by_valid_identifier` creates a Visit; identifier is
   resolved via `AccessService.resolveMember`/`resolveEmployee` (made
   public for this) — member checked first, then employee. Dedup: skip if
   that member/employee already has an open (no `checkOutTime`) visit at
   this branch on the event's own day (not "today" — matters for backlog
   entries). `checkInTime` is set from the event's `created_at`, not
   processing time.
3. `POST /api/v0/devices/pong` (~every 10s) and occasional
   `POST /api/v0/devices/refresh` — just acknowledged, no logic.

**Known unknowns, not yet worth chasing further:**
- The exact ack shape that makes the device stop resending isn't confirmed
  — it may just page forward on any 200, since the historical dump *did*
  advance chunk-by-chunk rather than repeating (each cycle's events were
  chronologically later than the last, not duplicates).
- Both gates were pre-provisioned by the installer pointing at BAS-IP's own
  vendor cloud `https://sip.bas-ip.com` (password <redacted — installer-provisioned, not ours>) with
  `is_enabled: false` — harmless leftover, not touched further.
- Device login for the *admin API* (used to read/write these Network
  settings remotely, not the Link protocol above) is `admin` / <redacted, see apps/api/.env BASIP_DEVICE_PASSWORD> on
  both gates — plaintext; our own outbound calls hash it as uppercase-hex
  MD5 in the query string, see `authenticate()` in `bas-ip-sync.service.ts`.

## Checklist for adding a new gate (any tenant)

1. Create the `Gate` row (`/app/settings/gates`): `deviceUrl`,
   `deviceUsername`, `devicePassword`, `lockNumber`, `genderRestriction`
   (null = no restriction), correct `branchId`.
2. On the physical device: Access management → Server manage access → enable
   "use custom server" →
   `https://gym.sparkco.vip/api/access/bas-ip?branchId=<branchId>&gateId=<gateId>&token=<DEVICE_TOKEN>`]
   
   (same global token as above).
3. Assign employees who should use this gate the right `gateAccessScope`
   (`organization` for all gates, `selected` + this gate, or leave `branch`
   if it's their home branch's only gate) via the employee's Gate Access
   panel — saving it is what triggers the local-list push.
4. Membership plans control which gates a *member* reaches:
   `allowAllBranches` (all tenant gates), `restrictToHomeBranch` (member's
   own branch only), or an explicit `MembershipPlanBranch` list. No manual
   per-member gate step needed — it follows their plan automatically on
   create/renew/freeze.
5. Test: scan a real QR at the gate, confirm the door opens *and* a
   Visit/EmployeeVisit row appears — the second part only works if step 2
   was done correctly.
