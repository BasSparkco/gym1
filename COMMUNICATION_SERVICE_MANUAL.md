# Communication Service — integration manual (for Claude)

Reference for calling the shared communication-service (email + WhatsApp) from another project. Read this instead of exploring that repo. Source of truth lives at `/opt/sites/api` on this box if anything here seems out of date.

## Base URL

- Prod: `https://api.sparkco.vip/api/v1`
- Local dev: `http://localhost:3001/api/v1`

## Auth

Every send/read call uses an API key in the `X-API-Key` header. Keys are minted from the dashboard (`https://dashboard.sparkco.vip` → API Keys page) or via `POST /api-keys` (JWT admin only — not something a client project can self-serve). Ask the human for a key; don't try to create one yourself unless you also have dashboard admin credentials.

```
X-API-Key: <key>
```

A key is optionally scoped to one tenant and to specific channels (`allowedChannels: ['email','whatsapp']`). A 401/403 means either the key is wrong or it's not allowed on the channel you're using.

## Response envelope

Every response is wrapped:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "human-readable message" }
```

Unwrap `.data` on success; read `.error` on failure. HTTP status codes are still meaningful (400/401/403/404/429/500).

## Send one message

`POST /messages/send` — returns `202` immediately (`{id, status: 'queued'|'scheduled'}`); delivery happens async.

```json
{
  "channel": "email",              // or "whatsapp"
  "to": "user@example.com",        // email address OR phone with country code, e.g. "+972501234567"
  "message": "Hello from us",      // required unless templateId is set
  "subject": "Welcome!",           // email only
  "templateId": "uuid",            // optional — send a stored template instead of `message`
  "variables": { "name": "Basel" },// {{placeholders}} for the template
  "sendAt": "2026-06-15T09:00:00+03:00", // optional, ISO 8601, max 30 days out
  "delaySeconds": 1800,            // optional, alternative to sendAt, max 30 days
  "sessionId": "Platinum Fitness"  // optional, WhatsApp only — routes to a specific branch session
}
```

```bash
curl -X POST https://api.sparkco.vip/api/v1/messages/send \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"channel":"whatsapp","to":"+972501234567","message":"Hi there"}'
```

Rules: exactly one of `message` / `templateId`. `to` is a raw phone number for WhatsApp (any non-digit characters are stripped server-side — `+`, spaces, dashes are all fine to include).

## Send bulk

`POST /messages/send-bulk` — same shape, plus `recipients: [{to, variables?}]` (max 100). Returns `{batchId, total, status, messages: [{id, to}]}`.

## Check a message's status

`GET /messages/:id` (API key, scoped to your own tenant's messages) → `{id, channel, to, status, createdAt, sentAt, deliveredAt, failedAt, errorMessage}`.

`status` progresses: `scheduled → queued → processing → sent → delivered` (WhatsApp only, device ack) `| failed`. Inbound messages use `received` instead (see below).

## Two-way WhatsApp / conversation history

`GET /messages?to=<phone>&direction=inbound|outbound&channel=whatsapp&limit=25&offset=0` — same endpoint as message listing, also serves as conversation history. Auth accepts either a dashboard JWT (sees everything) or your `X-API-Key` (auto-scoped to your tenant's own messages only — you cannot see another tenant's `to` filter results).

Response: `{total, limit, offset, items: [{id, channel, to, subject, status, direction, errorMessage, retryCount, createdAt, sentAt, failedAt}]}`. `direction` is `'inbound'` (received from the contact) or `'outbound'` (sent by you).

**There is no polling-free push to a browser from this service** (no WebSocket). To build a chat page with live incoming messages:
1. Register a webhook (below) pointed at *your own backend*, subscribed to `message.received`.
2. Your backend receives the webhook, stores/forwards it (e.g. via your own WebSocket/SSE to the browser, or just have the chat page poll `GET /messages?to=...` every few seconds — simplest option if you don't need sub-second latency).
3. Sending a reply from the chat page is just `POST /messages/send` with `channel: "whatsapp"` and `to` = the contact's number.

## Webhooks (real-time notifications)

`POST /webhooks` (JWT admin, or API key — API keys always create under their own tenant):
```json
{ "url": "https://your-app.example.com/hooks/comm", "events": ["message.received", "message.sent", "message.failed", "message.delivered"] }
```
Response includes `secret` (`whsec_...`) — **save it**, it's not retrievable again. Omit `events` to subscribe to all four.

Delivery: `POST` to your `url`, JSON body `{ event, messageId, channel, to, status, direction, body?, errorMessage?, tenantId, timestamp }` (`body` is only present on `message.received`), headers `X-Webhook-Event` and `X-Webhook-Signature: sha256=<hex hmac>`. Verify it:

```js
const crypto = require('crypto');
function verify(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}
```
Use the **raw** request body (before JSON parsing) for the HMAC check. Non-2xx responses trigger retries (3 attempts, exponential backoff) — respond fast and process async if needed.

## Templates (optional)

If you send the same message shape repeatedly, create a template once via the dashboard or `POST /templates` (`{name, channel, body, subject?}`, `{{placeholders}}` in `body`/`subject`), then reference it by `templateId` + `variables` instead of a literal `message` on every send call.

## Gotchas

- Channels are only `email` and `whatsapp` — no SMS (removed from this service).
- `to` for WhatsApp: include country code; formatting doesn't matter (non-digits stripped), but don't send a local-format number without one.
- Bulk cap is 100 recipients per call; script your own batching above that.
- Scheduling caps at 30 days out.
- A `409`/`429` on send-bulk or send usually means your API key's `rateLimitPerMinute` was hit — back off and retry, don't hammer.
- Swagger docs (if you need the exhaustive schema) are live at `<base-domain>/docs` (not under `/api/v1`).
