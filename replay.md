I read new_whatsapp.md and the actual current implementation (whatsapp-session.manager.ts, whatsapp.processor.ts in /opt/sites/api) to ground this in what you've already built rather than treating it as greenfield. Some important context up front: your plan is more conservative than what you already have. You already run BullMQ + Redis + Postgres, a DLQ module, webhook dispatch, per-key async locking, and a bounded-reconnect state machine that distinguishes reauth-required disconnects from transient ones. The gap isn't "build messaging infrastructure" — it's specifically the Puppeteer/Chromium transport layer, plus two things you haven't built yet at all: per-tenant rate limiting and dedup keys.

1. Executive Summary & Verdict
Verdict: Go, as a Hybrid Pivot — exactly as scoped in new_whatsapp.md, not a cutover.

The dual-provider abstraction with per-tenant provider flag (chromium | baileys) is the right call and should not be simplified away. Concretely:

Your resource problem is real and structural: WhatsAppSessionManager holds every tenant's Client (a full Chromium process) in one in-process Map, in a single apps/worker instance. That's O(n) Chromium processes on one box — it will not survive going from a handful of pilot tenants to 50+.
Baileys removes the Chromium tax almost entirely (WebSocket + Signal protocol crypto, no browser), which is the correct architectural fix for that specific problem.
But Baileys is not a strict upgrade — it trades resource cost for protocol fragility and a different (not lower) ban-risk profile. It is an unofficial, reverse-engineered reimplementation of WhatsApp's Noise/Signal wire protocol, maintained by volunteers who patch it reactively when WhatsApp changes the protocol. whatsapp-web.js, by contrast, drives the actual web.whatsapp.com JS bundle — when WhatsApp changes something, the real webpage updates itself and whatsapp-web.js mostly rides along. Baileys has historically had multi-day breakage windows after WA-side protocol changes until upstream patches land. That's the real cost of "no browser overhead," and it's why this has to stay a per-tenant toggle with instant rollback, not a flag day.
Everything in sections 3–20 of your plan (session manager, QR flow, status model, provider interface) is sound. The two places I'd push back are: (a) don't rebuild the queue/retry/webhook layer — it exists — and (b) budget real engineering time for auth-state storage, because useMultiFileAuthState (Baileys' default) is not production-safe and your plan correctly flags this in §9 but underweights it in the schedule.
2. Deep Benchmark & Performance Comparison
Resource Footprint Matrix
These are industry-observed ranges (Baileys/whatsapp-web.js community benchmarks + your own htop numbers), not a lab measurement I ran — treat the crossover point as directional and validate it yourself in §26/§27 before trusting it for capacity planning.

Tenants	Chromium (whatsapp-web.js) RAM	Chromium CPU (idle→send spike)	Baileys RAM	Baileys CPU	Cold-start (per session)
10	~1.5–3.0 GB (150–300MB × 10 procs)	2–5% idle/proc, spikes 30–60% on send/render	~300–800MB (30–80MB × 10 sockets)	<1% idle, brief spikes on crypto ops	Chromium: 3–8s (browser launch + WA Web JS load). Baileys: 1–3s (Noise handshake + Signal session init)
50	~7.5–15 GB — exceeds a typical single VM, forces horizontal sharding of Chromium instances across hosts	Aggregate CPU becomes the bottleneck before RAM does (each proc has its own GC, V8, layout/paint threads even headless)	~1.5–4 GB — fits comfortably on one mid-size VM	Scales near-linearly, event-loop-bound not CPU-bound	Same per-session, but Chromium restart storms (crash-loop) get expensive fast at this scale
100	~15–30 GB, effectively requires multi-host Chromium farm + sticky routing	File descriptor / process limits start mattering (ulimit -u, zombie reaping under load)	~3–8 GB, still single-host viable	Single event loop starts showing latency under concurrent decrypt/send bursts — this is where clustering starts to matter	—
500	Not realistic on this architecture without a dedicated Chromium fleet + orchestration (essentially a mini browser-farm SaaS)	—	~15–40 GB across a small cluster; needs multi-process sharding (see below)	Needs 2–4+ worker processes sharding tenants by hash, not a single event loop	—
The number that matters most for your decision isn't RAM at any one tier — it's that Chromium's curve forces a re-architecture (multi-host process farm) somewhere between 50 and 100 tenants, while Baileys' curve stays on "add more RAM/shard workers" until several hundred. That's the actual capacity cliff you're trying to avoid, not the per-instance RAM number.

Also worth being precise about, since your plan's §27 focuses on RAM/CPU: network I/O is not a meaningful differentiator — both providers maintain one persistent WebSocket per session to WhatsApp's servers; Baileys' is just not tunneled through a Chromium DevTools Protocol connection first, so it has slightly lower overhead per message but this is noise compared to the process-model difference.

Concurrency & Process Layout
Your current WhatsAppSessionManager is single-process: one apps/worker instance owns every session in one Map, serialized per-key via lockedOp. This has a subtle but important implication for the Baileys migration: the resource win from Baileys is partly wasted if you keep the single-process model, because you're still bound by one event loop's ability to service N concurrent WebSocket connections' worth of Signal-protocol decrypt/encrypt operations (these are synchronous CPU work — libsignal operations block the event loop, they don't await).

Recommendation:

Up to ~50–100 tenants: single Node process is fine. Baileys' event loop overhead per idle connection is tiny; the risk is decrypt-burst latency during high send volume, not idle cost.
Beyond that: shard tenants across worker processes by consistent hash of tenantId (not round-robin — you need session affinity so reconnect/status-lookup logic doesn't have to fan out). Node cluster or separate BullMQ worker processes each claiming a hash range works; Redis (which you already have) is the natural place to publish "which worker owns tenant X" for the API layer to route status/QR reads to.
Do not use worker_threads for this — Baileys sockets need to own long-lived TCP/TLS state and most of the work is I/O-bound event-loop scheduling, not CPU-bound computation suited to thread offload. Process-level sharding (what you'd do for Chromium anyway) is simpler and reuses your existing container/deploy model.
3. Anti-Ban Security & Protocol Risk Assessment
This is the section where I'd push back hardest on treating Baileys as strictly safer or riskier — it's differently risky, not more or less risky, and conflating the two leads to wrong mitigations.

Fingerprinting & Detection Reality
WhatsApp does not primarily detect "socket library vs. browser" at the TLS/transport level — both whatsapp-web.js and Baileys ultimately speak the same Noise-protocol-secured WebSocket to the same multi-device endpoints, and WhatsApp's own official multi-device linked-device feature (up to 4 companion devices) is a signal-only client with no browser, so a bare socket connection is not inherently suspicious to their infrastructure. What actually gets accounts flagged, in order of severity:

Behavioral/volume heuristics — burst sending, identical broadcast content to many numbers, no human pacing between sends, high first-contact-to-recipient ratio (messaging numbers that never messaged you back). This applies identically to both providers and is the dominant real-world ban cause for both.
Device metadata mismatch — Baileys requires you to declare a browser tuple (platform name + app version string) matching a real, current WhatsApp Web/Desktop version. A stale or implausible version string is a known trigger for forced logout/ban on reconnect, because it doesn't match what WhatsApp's servers expect a real client of that declared version to do. whatsapp-web.js doesn't have this problem because it is driving a real, auto-updating web client — the version string is always genuinely current. This is a maintenance burden Baileys adds that your plan doesn't currently account for: someone has to track and bump the declared WA Web version periodically.
IP/network correlation — many tenant numbers all connecting from the same datacenter IP block is a real signal WhatsApp's abuse systems use, independent of client library. If you're not already doing this, consider whether per-tenant or per-region egress IP diversity is worth it at scale — this is a bigger risk lever than the library choice.
Protocol drift breakage (Baileys-specific) — not a ban risk, but an availability risk: when WhatsApp changes the wire protocol, Baileys sessions can start failing (disconnect loops, auth failures) until the library is patched upstream. Your restartSession/scheduleReconnect logic will interpret this as "needs reauth" or "transient," neither of which is true — it's "the library itself is broken this week." Budget for pinning Baileys versions deliberately and testing upgrades in the pilot tenant before fleet-wide bumps, the same discipline you'd want for any protocol dependency.
Risk Mitigation Strategy — concrete patterns
Message pacing: your plan's §18 "1 msg/sec/tenant" is a reasonable floor, but add jitter (e.g., 800ms–1500ms randomized, not a fixed 1s tick) — perfectly regular intervals are themselves a bot signal.
Session warmth: don't send bulk notifications from a session within the first few hours of linking. Let a newly-linked session receive/exchange a few organic messages before it's used for automated blasts (subscription reminders etc.) — cold sessions doing immediate bulk sends are a known flag pattern.
Per-tenant AND global rate limits: your plan only specifies per-tenant. Add a global ceiling too, since many tenants' 1msg/s each still sums to a burst pattern from your infra that's visible to WhatsApp in aggregate over time (less so per-account, but worth having as a circuit breaker).
No parity requirement between Baileys and Chromium risk profiles: don't assume moving a tenant to Baileys is "safer" from a ban perspective and relax pacing/dedup discipline there — apply identical throttling to both providers.
4. Session Management & High Availability
What you should keep from the existing design (do not regress these)
Your current whatsapp-session.manager.ts already solves several hard problems your plan's §7/§15 describe abstractly — carry these patterns into the Baileys provider verbatim:

Per-key serialization (lockedOp): every start/stop/restart/reconnect for a given tenant is chained onto a promise so concurrent triggers can't race and produce two live sockets claiming the same linked device (which causes WhatsApp to force-logout one of them). Baileys needs this exactly as much as whatsapp-web.js does — a socket reconnect racing a manual "connect" API call will produce the same double-claim problem.
Reason-based branch between reconnect vs. relogin: LOGOUT/CONFLICT/UNPAIRED/UNPAIRED_IDLE → wipe and restart for fresh QR; everything else → bounded exponential reconnect reusing saved auth. Baileys' DisconnectReason enum (from @whiskeysockets/baileys) maps cleanly onto this same split (loggedOut vs. everything else) — this is close to a direct port.
Bounded reconnect with a real ceiling (MAX_RECONNECT_ATTEMPTS = 5, exponential 2s→30s) — your plan's §15 says "avoid infinite loops" but doesn't specify a number; you already have one that works, reuse it.
Hard-kill fallback on destroy: the comment at line 122–128 documents a real production incident (worker logout() hang freezing a tenant's Connect flow forever). Baileys doesn't have a browser process to SIGKILL, but the equivalent failure mode exists — a socket .end()/.logout() call can hang on a wedged connection. Race it against a timeout the same way.
Auth State — the actual hard part your schedule underweights
Your plan's §9 correctly lists PostgreSQL/Redis+Postgres/encrypted storage as production options, but §32's Day 2 treats "persist authentication" as one bullet alongside seven others. It deserves more:

Baileys' default useMultiFileAuthState writes dozens of small JSON files per session (creds + per-contact Signal session records, sender keys, pre-keys) with no atomicity or locking — it's explicitly a dev/demo helper, not production-grade. Under concurrent access (a reconnect racing a key rotation write) or a mid-write crash, this corrupts the session, forcing a full relink (QR rescan) — which is exactly the failure mode you're trying to eliminate with this whole migration.
Build a custom AuthenticationStateProvider (Baileys exposes the interface for this) backed by Postgres: one row per (tenantId, keyType, keyId) with the key blob, written inside a transaction. This is a genuinely non-trivial piece — treat it as its own Day 1.5–2 task, not a subtask of "Day 2 — Multi-Tenant Sessions." Get it wrong and every server restart or crash costs you a re-scan across your whole tenant base, which defeats the "zero data corruption on restart" requirement in your own §9.
Encrypt the key blobs at rest (you already note this requirement) — a Postgres column encrypted with a KMS-managed key, or pgcrypto, both work; don't roll your own crypto here.
Reconnection & HA
Nothing to add beyond what's above — your existing state machine is the right shape. One gap worth calling out: your current system has no cross-process session ownership model because everything is single-process. The moment you shard workers (§2 above) for Baileys scale, you need a source of truth for "which worker process currently owns tenant X's socket" so the API layer's QR/status reads and the connect-request queue route correctly — this doesn't exist yet and isn't in your plan. Redis (already in your stack) is the natural place: a whatsapp:owner:<key> key with the worker's instance ID, refreshed by the same heartbeat that already publishes status.

5. Feature Parity & API Capabilities
Capability	whatsapp-web.js (current)	Baileys	Notes
Inbound/outbound text	✅	✅	Direct parity
Media (image/PDF/doc/audio/video)	✅ (MessageMedia.fromUrl, your SSRF guard at line 26–36 applies)	✅ (sendMessage with {image/document/audio/video: {url}} or buffer)	Port the SSRF guard identically — Baileys will fetch the URL itself if you pass a URL-shaped media object; same risk.
QR generation	Event-driven (client.on('qr', ...))	Event-driven (connection.update event with qr field)	Structurally identical, near drop-in replacement for your publishQr/Redis-TTL pattern in §10.
Delivery status (sent/delivered/read)	message_ack event (you already only act on ACK_DEVICE+)	messages.update event with status enum (SERVER_ACK/DELIVERY_ACK/READ)	Direct parity, different event/enum names.
Read receipts	Passive (you read acks, don't send them)	Same — sending read receipts is opt-in either way	No behavior change needed.
Webhooks to your app	N/A (internal, you dispatch your own via WebhookDispatcherService)	N/A	Unaffected — this stays entirely your own layer regardless of provider.
Group/newsletter filtering	You already filter @g.us/@newsletter (line 259)	Same JID suffix convention exists in Baileys	Direct port.
@lid contact resolution	You have a two-tier resolution (getContactLidAndPhone → getContact() fallback, lines 550–569)	Baileys has its own LID handling but the API surface differs — this needs explicit testing, not an assumed port	This is genuinely provider-specific plumbing; don't assume it transfers 1:1. Flag as a pilot test item.
Overall: feature parity is achievable and Baileys is, if anything, a more complete low-level protocol implementation than whatsapp-web.js for delivery-status granularity. The one item I'd explicitly add to your §25 failure tests is @lid contact resolution, since it's real production logic you already had to build once and could silently regress.

6. Build vs. Adopt
Given you already have a hand-rolled queue/session/webhook layer that's more sophisticated than what off-the-shelf Baileys wrappers assume you're starting from, I'd lean build a thin BaileysWhatsAppProvider against your existing WhatsAppProvider interface, not adopt Evolution API / WAHA wholesale. Reasoning:

Evolution API and WAHA are themselves opinionated services with their own session storage, queueing, and webhook conventions. Adopting one means running their infrastructure alongside yours and translating between two webhook/queue systems — you'd be integrating a second message bus on top of the BullMQ/Postgres/webhook stack you've already built and hardened (DLQ, retry, SSRF guard, lid resolution). That's more moving parts and more failure surface than writing a Baileys provider class that plugs into infra you already trust.
Your differentiators (per-tenant debt computation triggers, membership-linked notification types, branch-level session routing via tenantId:sessionId) are baked into your existing WhatsAppSessionManager/processor. None of that maps cleanly onto a generic multi-tenant WhatsApp microservice's data model — you'd end up fighting their abstractions.
Where "adopt" earns its keep: if you want to look at Evolution API/WAHA's source for how they structure the Baileys AuthenticationStateProvider against Postgres/Redis (this is the fiddly part per §4 above) — read their auth-store implementations as a reference, don't run their service. That's a legitimate shortcut that saves real design time without adding a dependency.
7. Concrete Migration Roadmap & Action Plan
Your existing §32 schedule (Day 1–4) is reasonable pacing for the happy path but compresses the two riskiest items (auth-state durability, real ban-risk validation) into single bullets. Adjusted phasing:

Phase 0 — Interface extraction (0.5 day, do this first, not in parallel)
Extract WhatsAppProvider interface from what WhatsAppSessionManager/whatsapp.processor.ts currently do implicitly. Rename the existing class to ChromiumWhatsAppProvider behind that interface before writing any Baileys code — this de-risks the whole migration because it proves the abstraction against a known-working implementation first, and gives you the seam to plug Baileys into without touching the processor or queue.

Phase 1 — PoC (1–1.5 days)
One Baileys session, one tenant, hardcoded — connect, QR, send/receive text. Confirms the library works in your environment before any infra investment.

Phase 2 — Auth state + Session Manager (2 days, not 1)
Postgres-backed AuthenticationStateProvider (per §4), port the lock/reconnect/restart state machine from the existing manager, multi-tenant key routing (tenantId / tenantId:sessionId — preserve your branch-session convention). Test server-restart recovery explicitly here, not later — it's cheaper to find auth-state bugs before the queue/rate-limiting layer is built on top.

Phase 3 — Wire into existing queue/webhook layer (0.5–1 day)
This is smaller than your plan assumes because BullMQ, retries, DLQ, and webhook dispatch already exist — it's routing, not building. Add the two genuinely-missing pieces here: per-tenant rate limiting (token bucket in Redis, keyed by tenant) and a dedup key (your plan's §14 design is fine — tenantId:memberId:messageType:subscriptionId:date as a Redis SETNX with TTL, checked before enqueue).

Phase 4 — Failure tests + provider toggle (1 day)
Run your §25 failure test list against Baileys specifically, plus the @lid resolution test flagged in §5. Add the provider column/toggle and confirm a mid-flight rollback (Baileys→Chromium) doesn't lose or duplicate in-flight messages.

Phase 5 — Pilot (24–72h, per your §26, unchanged)
One real tenant, monitor RAM/CPU/disconnects/duplicates per your existing list. Add: watch for auth-state corruption specifically (a session that silently degrades to requiring re-scan is the failure mode unique to Baileys' key storage, and won't show up as an obvious crash).

Phase 6 — Gradual rollout (per your §29, unchanged) — 1 → 3 → 10 → 25 → 50 → all, with a stop-the-line rule on any unexplained disconnect spike.

Phase 7 — Retire Chromium (per your §30, unchanged) — only once zero tenants depend on it and Baileys has run clean through at least one full billing cycle (so subscription-expiry/payment-due notification types — your highest-volume automated sends — have been exercised in production, not just pilot).

One structural risk I'd flag before you start: onModuleInit currently loads every tenant session on worker boot sequentially (lines 91–97), each doing a real network handshake. For Chromium this is already slow at scale; for Baileys it'll be faster per-session but you should parallelize this loop (bounded concurrency, e.g. 10 at a time) regardless of provider once tenant count grows, or worker restarts become a multi-minute reconnect storm.

Want this as a shareable document for your team, or is this staying as your own working reference for now?