Is the API key why other branches show "Device disconnected"?
No. Look at tenancy.service.ts: every WhatsApp call already includes sessionId=branchId:


connectBranchWhatsApp(branchId: string) {
  return sparkcoFetch(`/me/providers/whatsapp?sessionId=${encodeURIComponent(branchId)}`, 'PUT');
}
One SPARKCO_API_KEY already supports unlimited WhatsApp sessions — each branch is its own session, keyed by sessionId. That's by design (the manual confirms sessionId is "optional, WhatsApp only — routes to a specific branch session").

"Device disconnected — waiting for new QR code" on the other branches just means those branches haven't been paired yet — each branch's WhatsApp session needs its own phone-scan, same as pairing a new WhatsApp Web device. It's expected, not a key problem. Go to each branch's WhatsApp panel and scan its QR to connect it.

One key per tenant, per branch, or one key for everything?
Per branch: no. Branches already share one key fine via sessionId — splitting keys per branch buys you nothing since branches within a tenant already trust each other in your data model.

Per gym tenant: yes, recommended, once you onboard other real customers. Two reasons, one of which is a real landmine I found while checking this:

SparkCo's own key scoping — a key is "optionally scoped to one tenant," and GET /messages auto-scopes to the key's tenant. One shared key across gym customers throws that isolation away and leans entirely on your own tenantId filtering.

Real bug risk: inbound WhatsApp replies are matched purely by phone digits, globally, in messages.service.ts:212-247 — the code comment even says it: "Ties (two members sharing digits, e.g. across tenants) are broken in favor of whichever candidate already has a thread." If two different gym-owner customers share one SparkCo key/webhook, a member's reply from one tenant could get matched to a same-numbered member in a different tenant. With only one real tenant today this is dormant, but it's exactly the kind of thing that bites you at your first cross-tenant WhatsApp collision.

Note the inbound webhook payload does carry SparkCo's own tenantId field (sparkco-webhook.controller.ts:27), but the controller currently ignores it — it isn't used to scope resolveMemberByPhone. Also, SPARKCO_WEBHOOK_SECRET is a single env var and register-sparkco-webhook.ts creates one webhook subscription per run — so moving to per-tenant keys means also registering a webhook per key, storing multiple secrets, and using the payload's tenantId to pick the right secret and scope the member lookup. That's real follow-up work, not just an env var change.

Bottom line: keep one key for now (fine at current scale — one real branch connected, others just need pairing). When you onboard the next paying gym tenant, give them their own SPARKCO_API_KEY + webhook registration, and fix resolveMemberByPhone to scope by the webhook's tenantId instead of scanning all members globally — otherwise cross-tenant phone collisions are a live risk, not hypothetical.

---

Follow-up (2026-08-08): "Device disconnected" was actually a bug, not just an unpaired branch

Traced through SparkCo's own source (/opt/sites/api) to find out why other branches showed "Device disconnected — waiting for new QR code…" instead of a QR.

Root cause: SparkCo's backend can't tell "session never started" apart from "session died." Both report the same thing:

  // /opt/sites/api/apps/api/src/modules/tenants/provider-configs.service.ts:147
  const status = (await redis.get(`whatsapp:status:${sessionKey}`)) ?? 'disconnected';

If nobody ever clicked Connect for a branch, there's no Redis key at all, so it defaults to 'disconnected' — identical to a real dropped session. Same for the QR: getWhatsAppQr just reads whatsapp:qr:${sessionKey} and returns null if it was never set.

On our side, WhatsAppCard.tsx (apps/web/src/app/app/branches/[branchId]/WhatsAppCard.tsx) misread that combination — it assumed "disconnected + no QR" always meant a session used to exist and is mid-restart:

  if (waStatus === "disconnected" && !qr) {
    // Worker is restarting the session (device was removed) — show reconnecting
    setStatus("reconnecting");

But that's also exactly what a never-connected branch looks like. And the "reconnecting" UI state had no Connect button — just a pulsing dot and text — so a never-connected branch got stuck polling a dead end forever with no way to fix it from the UI.

Fix applied (commit 6802795, 2026-08-08): added a Connect button to the "reconnecting" state in WhatsAppCard.tsx, reusing the existing handleConnect() (same PUT /api/tenancy/whatsapp/branches/:branchId call as the normal Connect flow). This re-registers the session on SparkCo and kicks the worker into generating a fresh QR — works whether the branch was never connected or genuinely lost its device.

Deployed: `docker compose -f docker-compose.prod.yml build web && docker compose -f docker-compose.prod.yml up -d web` (web only — change didn't touch apps/api).

If this resurfaces later: check `docker compose -f docker-compose.prod.yml logs api` for SparkCo call errors first, then confirm via SparkCo dashboard / `POST /me/providers/whatsapp/verify?sessionId=<branchId>` whether a session actually exists before assuming it's another instance of this same bug.

