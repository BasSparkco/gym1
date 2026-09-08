# New WhatsApp Gateway — Implementation Plan

## 1. Objective

Replace the current Chromium / WhatsApp Web session architecture with a lightweight WhatsApp gateway based on **Baileys**, while keeping the existing production system fully operational during development and migration.

Main goals:

- Eliminate the need for one Chromium instance per club.
- Significantly reduce RAM and CPU consumption.
- Support a larger number of concurrent club WhatsApp sessions.
- Keep the existing QR-code connection experience for club owners.
- Minimize changes to the existing Gym SaaS.
- Allow immediate rollback to the current Chromium implementation.
- Build a reusable WhatsApp gateway that can later serve other Sparkco applications.

---

# 2. Migration Strategy

The current WhatsApp implementation must NOT be removed during development.

The new service will run in parallel:

```text
Gym SaaS
   |
   +--> WhatsApp V1 --> Chromium --> WhatsApp Web
   |
   +--> WhatsApp V2 --> Baileys --> WhatsApp
```

Each club will have a configurable provider:

```text
chromium
baileys
```

This allows migration one tenant at a time.

Example:

```text
Club A -> chromium
Club B -> chromium
Club C -> baileys
Club D -> chromium
```

If Baileys has a problem for a specific tenant, that tenant can immediately be switched back to Chromium.

---

# 3. Phase One — Audit the Current Implementation

Before writing the new gateway, identify every WhatsApp-related component in the existing system.

Review:

- Where WhatsApp sessions are created.
- How QR codes are generated.
- How session credentials are stored.
- How sessions are mapped to tenants.
- How messages are sent.
- How disconnect events are detected.
- How reconnection currently works.
- Whether messages are sent directly or through a queue.
- How Chromium processes are created and destroyed.
- Whether each tenant has its own Chromium instance.
- How logout is handled.
- How session status is exposed to the frontend.
- How automated subscription messages trigger WhatsApp sending.

The result of this phase should be a clear map of the current WhatsApp flow.

---

# 4. Create a Common WhatsApp Provider Interface

The Gym SaaS should not need to know whether a club uses Chromium or Baileys.

Create a common interface:

```ts
interface WhatsAppProvider {
  connect(tenantId: string): Promise<void>

  disconnect(tenantId: string): Promise<void>

  logout(tenantId: string): Promise<void>

  getStatus(
    tenantId: string
  ): Promise<WhatsAppStatus>

  sendText(
    tenantId: string,
    phone: string,
    message: string
  ): Promise<SendResult>
}
```

Possible implementations:

```text
ChromiumWhatsAppProvider
BaileysWhatsAppProvider
```

The rest of the application communicates only with the common interface.

---

# 5. Create WhatsApp Gateway V2

Create a dedicated service for WhatsApp.

Recommended stack:

```text
Node.js
TypeScript
Baileys
PostgreSQL
Redis
BullMQ
Docker
```

Possible project structure:

```text
services/
    whatsapp-gateway/
```

Alternatively, it can be maintained as a separate repository:

```text
sparkco-whatsapp-gateway
```

The gateway should run independently from the Next.js application.

---

# 6. Proposed Architecture

```text
                         Gym SaaS
                            |
                            v
                     Messaging API
                            |
                            v
                      Redis / BullMQ
                            |
                            v
                  WhatsApp Gateway V2
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
          Tenant A       Tenant B       Tenant C
          Baileys        Baileys        Baileys
             |              |              |
             +--------------+--------------+
                            |
                            v
                         WhatsApp
```

There should be no Chromium process for Baileys tenants.

---

# 7. Multi-Tenant Session Manager

Each club must have an independent WhatsApp session.

Example:

```text
tenant_101
tenant_102
tenant_103
```

The Session Manager will be responsible for:

- Creating sessions.
- Loading existing sessions.
- Tracking connection state.
- Reconnecting disconnected sessions.
- Destroying sessions.
- Logging out sessions.
- Restoring sessions after server restart.
- Preventing duplicate sockets for the same tenant.

---

# 8. Session Status Model

Recommended statuses:

```text
DISCONNECTED
QR_REQUIRED
CONNECTING
CONNECTED
RECONNECTING
LOGGED_OUT
ERROR
```

Each session should contain metadata such as:

```text
tenantId
phoneNumber
status
connectedAt
lastConnectedAt
lastDisconnectAt
disconnectReason
retryCount
provider
```

---

# 9. Authentication State

For the first prototype, Baileys authentication state may be stored using isolated tenant directories:

```text
whatsapp_sessions/
│
├── tenant_101/
│
├── tenant_102/
│
└── tenant_103/
```

For production, implement a more controlled storage layer.

Possible options:

```text
PostgreSQL
Redis + PostgreSQL
Encrypted persistent storage
```

Important requirements:

- Authentication credentials must persist across restarts.
- Authentication keys must never be sent to the frontend.
- Sensitive authentication data must not appear in logs.
- Production authentication data should be encrypted where practical.
- Session storage must remain strictly isolated by tenant.

---

# 10. QR Code Connection Flow

The club owner continues using the existing user experience:

```text
Settings
   ↓
WhatsApp
   ↓
Connect WhatsApp
```

The backend calls:

```http
POST /sessions/:tenantId/connect
```

The gateway creates a Baileys socket.

When Baileys produces a QR event:

```text
Baileys
   |
   v
WhatsApp Gateway
   |
   v
Gym Backend
   |
   v
WebSocket / SSE
   |
   v
Frontend
```

The frontend displays the QR code.

After successful scanning:

```text
status = CONNECTED
```

---

# 11. Gateway API

## Connect Session

```http
POST /sessions/:tenantId/connect
```

## Get Session Status

```http
GET /sessions/:tenantId/status
```

Example response:

```json
{
  "tenantId": "101",
  "status": "CONNECTED",
  "phoneNumber": "9725XXXXXXX"
}
```

## Send Message

```http
POST /sessions/:tenantId/send
```

Example:

```json
{
  "to": "9725XXXXXXX",
  "message": "Your subscription will expire in three days."
}
```

## Restart Session

```http
POST /sessions/:tenantId/restart
```

## Logout

```http
POST /sessions/:tenantId/logout
```

---

# 12. Message Queue

The Gym API should preferably not send directly to WhatsApp.

Recommended flow:

```text
Gym Backend
     |
     v
Redis / BullMQ
     |
     v
WhatsApp Worker
     |
     v
Baileys
     |
     v
WhatsApp
```

Example job:

```json
{
  "tenantId": "101",
  "type": "WHATSAPP_TEXT",
  "to": "9725XXXXXXX",
  "message": "Your subscription will expire in three days."
}
```

Benefits:

- Messages survive temporary WhatsApp outages.
- Retry logic becomes easier.
- Sending is separated from HTTP requests.
- Per-tenant rate limiting becomes possible.
- Failed messages can be inspected and retried.

---

# 13. Retry System

Messages must not disappear because of temporary failures.

Example retry strategy:

```text
Attempt 1
   ↓
30 seconds

Attempt 2
   ↓
2 minutes

Attempt 3
   ↓
10 minutes

Attempt 4
   ↓
FAILED
```

Store:

```text
messageId
tenantId
recipient
status
attempts
error
createdAt
sentAt
```

Retry only failures that are safe to retry.

---

# 14. Message Deduplication

Automated messages must not be sent twice because of:

- Worker restart.
- Server restart.
- Queue retry.
- Duplicate event.
- Application retry.

Use a deduplication key.

Example:

```text
tenantId
memberId
messageType
subscriptionId
date
```

Possible generated key:

```text
101:member-554:subscription-expiring:sub-992:2026-08-25
```

Before sending an automated notification, verify that the same logical message has not already been successfully sent.

---

# 15. Reconnection Strategy

The gateway must distinguish temporary disconnects from actual logout.

Temporary situations include:

```text
Internet interruption
Socket closed
Server restart
Temporary WhatsApp connectivity problem
Network timeout
```

Status:

```text
RECONNECTING
```

The Session Manager creates a new socket using the existing credentials.

If WhatsApp invalidates the linked device or the user logs out:

```text
LOGGED_OUT
```

The user must be asked to scan a new QR code.

Avoid infinite uncontrolled reconnect loops.

---

# 16. Provider Selection

Add a provider field for every tenant.

Example database field:

```text
whatsapp_provider
```

Allowed values initially:

```text
chromium
baileys
```

Example:

```text
Tenant 101 -> baileys
Tenant 102 -> chromium
Tenant 103 -> chromium
```

This is the main safety mechanism during migration.

---

# 17. Unified Message Wrapper

The Gym application should continue using one function:

```ts
sendWhatsAppMessage(
  tenantId,
  phone,
  message
)
```

Internally:

```ts
if (provider === "baileys") {
  return baileysProvider.send(...)
}

return chromiumProvider.send(...)
```

This prevents WhatsApp implementation details from spreading throughout the application.

---

# 18. Rate Limiting

Each tenant should have controlled message throughput.

Recommended structure:

```text
Tenant Queue
     |
     v
Rate Limiter
     |
     v
WhatsApp Provider
```

Start conservatively.

Example initial configuration:

```text
1 message / second / tenant
```

The exact limits can later be adjusted based on real production behavior.

Do not allow one tenant to block the queues of all other tenants.

---

# 19. Existing Message Types

All existing automated Gym SaaS notifications must be tested against V2.

Examples:

```text
Subscription activation
Subscription expires soon
Subscription expired
Payment due
Birthday greeting
Administrative notifications
Other existing automated messages
```

Each message type must be verified before full migration.

---

# 20. Media Support

Start with text messages.

After text messaging is stable, test any currently supported media:

```text
Images
PDF files
Documents
Audio
Video
```

Media handling should be treated as a separate testing phase because it has different memory, file handling, and failure characteristics.

---

# 21. Database Design

## whatsapp_sessions

Suggested fields:

```text
id
tenant_id
provider
phone_number
status
connected_at
last_connected_at
last_disconnected_at
disconnect_reason
retry_count
created_at
updated_at
```

## whatsapp_messages

Suggested fields:

```text
id
tenant_id
recipient
message_type
status
attempts
error
deduplication_key
created_at
sent_at
```

Additional tables may be introduced later for:

```text
message_events
session_events
provider_health
```

---

# 22. Logging

Every log entry related to WhatsApp should identify the tenant.

Example:

```text
[tenant:101] WhatsApp connected

[tenant:101] Message sent
recipient=9725XXXXXXX

[tenant:102] WhatsApp disconnected
reason=connectionClosed
```

Never log:

```text
Authentication credentials
Encryption keys
Full sensitive session state
```

---

# 23. Monitoring

Expose operational metrics such as:

```text
active_sessions
connected_sessions
disconnected_sessions
reconnecting_sessions

messages_sent
messages_failed
messages_pending

reconnect_count
queue_size
```

Initially these metrics can be displayed in an internal administration page.

Later they can be connected to:

```text
Prometheus
Grafana
```

---

# 24. Server Restart Recovery

This is a mandatory test.

Execute:

```text
docker restart whatsapp-gateway
```

Expected behavior:

```text
Gateway Starts
      |
      v
Load Stored Sessions
      |
      v
Create Baileys Sockets
      |
      v
Reconnect
      |
      v
CONNECTED
```

Existing linked sessions should not require a new QR code after a normal restart.

---

# 25. Failure Tests

Before production migration, test at least:

## Process Failure

```text
Kill Node.js process
```

## Container Restart

```text
docker restart whatsapp-gateway
```

## Server Restart

```text
reboot
```

## Network Failure

Temporarily interrupt network connectivity.

## Linked Device Removal

Remove the linked device from WhatsApp on the phone.

## Logout

Test explicit logout.

## Invalid Recipient

Attempt to send to an invalid phone number.

## Queue Failure

Restart Redis / worker where appropriate.

## Duplicate Job

Submit the same automated message twice and verify deduplication.

---

# 26. Pilot Club

Do not migrate all tenants immediately.

Select one club as the pilot:

```text
Pilot Club
```

Run it using Baileys for approximately:

```text
24–72 hours
```

Monitor:

```text
RAM
CPU
Disconnects
Reconnects
Failed messages
Duplicate messages
Message latency
QR behavior
Server restart recovery
Logout behavior
```

The existing Chromium implementation remains available as fallback.

---

# 27. Resource Comparison

Record the current Chromium baseline before migration.

Example:

```text
10 active Chromium sessions

Total RAM:
Average RAM:
CPU idle:
CPU while sending:
Number of processes:
```

Then test approximately the same number of Baileys sessions.

Compare:

```text
RAM per session
Total RAM
CPU usage
Process count
Reconnect time
Message latency
Long-running memory behavior
```

The main purpose of this project is not only to make Baileys work, but to verify that it actually solves the resource problem.

---

# 28. Rollback Plan

Rollback must remain simple.

If a tenant experiences problems:

```text
provider = baileys
```

can be changed to:

```text
provider = chromium
```

Then that tenant returns to the existing system.

Do not delete the Chromium implementation during the initial production rollout.

---

# 29. Gradual Migration

Recommended migration sequence:

```text
1 Club
   ↓
3 Clubs
   ↓
10 Clubs
   ↓
25 Clubs
   ↓
50 Clubs
   ↓
All Clubs
```

At every stage:

- Check resource usage.
- Check session stability.
- Check failure rate.
- Check reconnect behavior.
- Check queue health.

Stop migration if unexpected behavior appears.

---

# 30. Retiring Chromium

Chromium should only be retired when:

```text
No production tenant depends on Chromium
```

and Baileys has demonstrated acceptable stability over a sufficient production period.

Then remove or disable:

```text
Puppeteer
Chromium containers
Old WhatsApp workers
Unused session storage
```

Keep the old implementation available in source control for an appropriate rollback period.

---

# 31. Recommended Project Structure

```text
whatsapp-gateway/
│
├── src/
│   ├── api/
│   │   ├── sessions.controller.ts
│   │   └── messages.controller.ts
│   │
│   ├── providers/
│   │   ├── whatsapp-provider.interface.ts
│   │   ├── baileys.provider.ts
│   │   └── chromium.provider.ts
│   │
│   ├── sessions/
│   │   ├── session-manager.ts
│   │   ├── session-store.ts
│   │   └── reconnect-manager.ts
│   │
│   ├── messages/
│   │   ├── message.service.ts
│   │   ├── message-worker.ts
│   │   └── message-queue.ts
│   │
│   ├── auth/
│   │   └── baileys-auth-store.ts
│   │
│   ├── monitoring/
│   │   └── metrics.ts
│   │
│   └── app.ts
│
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

# 32. Estimated Implementation Schedule

## Day 1 — Prototype

Tasks:

- Audit the existing WhatsApp implementation.
- Identify integration points.
- Define `WhatsAppProvider`.
- Create the Gateway V2 project.
- Install and configure Baileys.
- Create one session.
- Generate QR.
- Connect one WhatsApp account.
- Send the first text message.

Target:

```text
ONE BAILEYS SESSION WORKING
```

---

## Day 2 — Multi-Tenant Sessions

Tasks:

- Implement Session Manager.
- Support multiple tenants.
- Persist authentication.
- Implement reconnect.
- Implement restart recovery.
- Add API endpoints.
- Add session statuses.
- Add structured logging.

Target:

```text
MULTIPLE PERSISTENT SESSIONS
```

---

## Day 3 — Messaging Infrastructure

Tasks:

- Integrate Redis.
- Integrate BullMQ.
- Implement Message Worker.
- Implement retries.
- Implement deduplication.
- Implement rate limiting.
- Improve error handling.
- Add message status tracking.

Target:

```text
PRODUCTION-LIKE MESSAGE PIPELINE
```

---

## Day 4 — Gym Integration and Pilot

Tasks:

- Connect Gateway V2 to Gym SaaS.
- Implement provider selection.
- Move one test tenant to Baileys.
- Test automated notifications.
- Run failure tests.
- Compare RAM and CPU.
- Verify rollback.
- Start pilot monitoring.

Target:

```text
FIRST REAL CLUB RUNNING ON BAILEYS
```

---

# 33. Definition of Done

WhatsApp Gateway V2 is not considered production-ready until all of the following are verified:

- QR connection works.
- Session credentials persist.
- Normal server restart does not require a new QR.
- Text messaging works.
- Multi-tenant isolation works.
- Each tenant sends from the correct WhatsApp account.
- Reconnect works.
- Queue processing works.
- Retry handling works.
- Deduplication works.
- No duplicate automated notifications are observed.
- Logout state is correctly detected.
- Session status is visible to the application.
- RAM consumption is significantly lower than Chromium.
- CPU usage is acceptable.
- Long-running sessions do not show unacceptable memory growth.
- A tenant can be rolled back to Chromium.
- Existing production behavior remains unaffected during migration.

---

# 34. Critical Rule

```text
DO NOT BREAK THE CURRENT SYSTEM
```

Gateway V2 must be developed and tested in parallel.

Do not make large destructive changes to the existing Chromium implementation until the Baileys implementation has successfully passed production testing.

---

# 35. Final Target Architecture

```text
                    Sparkco Gym SaaS
                           |
                           v
                    Messaging Layer
                           |
                           v
                     Redis / BullMQ
                           |
                           v
                 WhatsApp Gateway V2
                           |
           +---------------+---------------+
           |               |               |
           v               v               v
        Club 101         Club 102         Club 103
        Session          Session          Session
        Baileys          Baileys          Baileys
           |               |               |
           +---------------+---------------+
                           |
                           v
                        WhatsApp
```

Final objective:

```text
NO CHROMIUM INSTANCE PER TENANT
```

The new architecture should provide a lightweight, isolated, recoverable, multi-tenant WhatsApp messaging layer while allowing the existing Gym SaaS to continue operating with minimal changes.
