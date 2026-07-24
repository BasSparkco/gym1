# ROADMAP.md

# Spark Gym ERP Roadmap

This roadmap separates MVP scope from later-phase expansion so the first release stays realistic and operationally useful.

Development Standard

* pnpm is the default package manager for project setup, dependency installation, and workspace scripts.

Current Status Snapshot (refreshed 2026-07-23)

* Overall status: MVP (Phase 0-1) complete and in production; Phase 2 (Operations) mostly built; Phase 4 (Access) partially delivered via QR/BAS-IP instead of RFID; Phase 5 (Mobile) backend groundwork started.
* Phase 0 status: Done
* Phase 1 status: Done (pilot-ready MVP live in production; only Push notifications from the original MVP notification list remain unbuilt — SMS/WhatsApp/Email are live)
* Phase 2 status: Started — Training Programs, Classes & Coaches fully built and deployed (schema, backend, frontend, e2e coverage); Lockers not started
* Phase 3 status: Not Started
* Phase 4 status: Partial — QR-based access control, BAS-IP device sync, gate open, and multi-gate ("Smart Gates": gender restriction, per-gate assignment) are live in production. RFID/fingerprint/face recognition were superseded by QR for this customer and are not built.
* Phase 5 status: Started — member-facing auth backend (PIN sign-in, bearer sessions, `/me`, `/me/qrcode`) is built (commit `806b8e2`, 2026-07-21) and **live in production** (verified 2026-07-23: `POST /api/member-auth/sign-in` returns 401, confirming the route is registered). No native Android/Flutter app exists yet — only the API contract it will consume, documented in `gym_mobile_roadmap.md`.
* Phase 6-7 status: Not Started

Current completed work

* Product planning documents are in place for MVP scope, business rules, pilot workflow, route map, tickets, sprint backlog, and milestone board.
* The monorepo workspace has been set up with pnpm.
* The frontend Next.js app has been scaffolded and converted to pnpm.
* The backend NestJS app has been scaffolded and created with pnpm.
* Sprint 0 frontend baseline is in place with a sign-in page, app shell, and dashboard scaffold.
* Sprint 0 backend baseline is in place with API bootstrap configuration and MVP-aligned module skeletons.
* Sprint 1 auth foundation is in place with sign-in, sign-out, current-session, and protected `/app/dashboard` routing.
* Frontend sign-in is now wired to the backend with a working session-cookie flow for pilot users.
* Pilot auth state now persists locally outside the repo-tracked workspace files, and seeded passwords are stored as salted hashes.
* The dashboard now loads protected tenant-scoped summary data from the backend instead of using static frontend placeholders.
* Dashboard metrics are computed from persisted member, membership, visit, and payment seed records aligned to the MVP data model.
* Operational records now live behind member, membership, visit, and payment module services and protected APIs instead of being owned inside the reports module.
* Sprint 2 branches module is in place with full CRUD (list, create, get, update) and extended BranchRecord (status, address, phone).
* Sprint 2 users module is in place with list, create, get, update, and a static roles endpoint returning MVP role definitions.
* Sprint 2 frontend covers branches, members, and users pages with create/edit forms wired through server actions.
* Active-link navigation now uses usePathname() in a client NavMenu component for accurate sidebar highlighting.
* Memberships, payments, and visits each now have a GET /:id endpoint in addition to list and create.
* Sprint 2.5 settings module is in place: GET and PATCH /settings endpoints with tenant-scoped language configuration.
* Settings frontend at /app/settings/language allows owners to select the default language and toggle English, Arabic, and Hebrew visibility.
* Root layout reads the spark_gym_lang cookie to set html lang and dir, enabling full RTL for Arabic and Hebrew from first render.
* Settings link added to the sidebar navigation, visible to owners only.
* MVP feature set (Sprints 1-8) is complete: branches, members, membership plans, sales/renewals/freezes/unfreezes, payments, check-in, visits, notifications list, reports, role guards, and pilot-ready e2e coverage. See [status.md](status.md) for the full sprint history.
* Notification delivery groundwork is in place: a pluggable `NotificationProvider` interface with a console/log stand-in provider, a dispatch service that updates record status/sentAt, owner/manager-only scan and dispatch endpoints, and event-driven notification creation wired into membership sales/renewals and pending payments — all gated by the existing per-event channel settings in Settings -> Notifications. Real SMS/WhatsApp/email backends are not yet connected (see [status.md](status.md) "Notification Delivery — Groundwork").
* SparkCo messaging is live: email and WhatsApp delivery confirmed end-to-end via `POST /api/v1/messages/send`. SMTP removed — SparkCo handles all delivery.
* Pilot release gate walkthrough complete: full member lifecycle confirmed end-to-end with real credentials.
* Member photo storage now uses MinIO (S3-compatible object storage) instead of local disk, proxied through the API at the same /api/uploads/members/<file> path with no frontend changes; auth sessions now live in Redis instead of Postgres, with native TTL expiry replacing manual filtering and removing the need for a cleanup job.
* Postgres/Prisma is now the persistence layer for everything (real FKs, no JSON stores); Redis backs auth sessions, MinIO backs member photos. Security hardening done: `Secure` cookie fixed, reports role-gated, sign-in rate-limited, nightly backup script in place. e2e suite green 40/40.
* Training Programs, Classes & Coaches (Phase 2) shipped and deployed: `TrainingProgram`/`CoachProfile`/`ClassSession`/`ClassBooking`/`MembershipPlanProgram` with capacity/waitlist handling, coach = `Employee` extension, attendance reuses the `Visit` model.
* Every `User` account now requires a 1:1 link to an `Employee` record (enforced FK + backfill), closing a prior gap where account creation didn't require a real staff record.
* Demo feedback pass: per-branch/tenant logos, member profile page redesign (pine/mist/volt design system), RTL phone-number display fix, shared `ui/` primitives (button, card, badge, stat-card, empty-state, page-header).
* Member-facing auth backend built for the mobile app (Phase 5 groundwork): PIN sign-in, Redis-backed bearer sessions, `/me` and `/me/qrcode` — see `gym_mobile_roadmap.md`. Not yet deployed to production.
* Broad UI refresh across dashboard, branches, members, employees, membership-plans, training-programs, and sign-in pages, plus a members/employees/users list-page refactor into shared, reusable list components (2026-07-21 to 2026-07-23, commits `a5c874e`/`242eaee`).

Current next focus

* **Phase 5 — Mobile app**: backend contract is built, deployed, and verified live (2026-07-23); next is the actual Android/Flutter client (see `gym_mobile_roadmap.md` for the recommended stack and API reference).
* **RFID/fingerprint/face recognition**: deliberately not pursued — this customer's hardware uses QR, which is already live. Revisit only if a future customer specifically needs card/biometric access.

---

# Phase 0 – Discovery & Analysis

Status

* In Progress

Objectives

* Gather requirements from gym owners.
* Analyze existing market solutions.
* Define database entities.
* Define system modules.
* Prepare ERD diagrams.
* Prepare UI wireframes.
* Standardize the monorepo tooling around pnpm.

Deliverables

* Requirements document - Done
* ERD - Done
* UI mockups - Not Started
* Technical architecture - Not Started
* Workspace setup baseline using pnpm - Done

---

# Phase 1 – MVP

Status

* Started

Goal

Launch a working product for pilot customers.

Target Outcome

Deliver a focused web MVP for gyms and fitness centers that solves the daily operational flow before expanding into advanced hardware, commerce, mobile, and AI.

Modules

### Core Platform

* Authentication
* Roles & Permissions
* Tenants
* Branches
* Settings (language configuration, enabled languages)
* Session storage (Redis) and object storage (MinIO) for member photos

### Members

* Member profiles
* Memberships
* Visits
* Member photos
* Emergency contacts

### Access Control

* Manual validation
* Access logs
* QR access

### Payments

* Membership payments
* Payment history
* Receipt/reference tracking

### Notifications

* SMS
* WhatsApp
* Email

### Reports

* Active memberships
* Expired memberships
* Visit reports
* Payment summary reports

Deliverables

* First production-ready release - Not Started
* Pilot-ready web application - In Progress
* Clear boundary for later-phase capabilities - Done
* Authentication and protected-shell foundation - Done
* Branches, users, and roles management foundation - Done

---

# Phase 2 – Operations

Status

* Started — Training Programs & Classes design finalized, implementation in progress. See [docs/Training Programs & Classes Design.md](docs/Training%20Programs%20%26%20Classes%20Design.md) for the full architecture.

Modules

### Training Programs, Classes & Coaches

* `TrainingProgram` — the activity/discipline (tenant-scoped, optionally branch-specific).
* `CoachProfile` — 1:1 extension of the existing `Employee` model (specializations, certifications) rather than a duplicate person entity.
* `ClassSession` — scheduled occurrences of a Training Program (template+instance split via `recurrenceId` for recurring schedules).
* `ClassBooking` — member enrollment/waitlist/attendance per session, transaction-safe capacity handling, entitlement check against `MembershipPlan.allowAllPrograms` / `MembershipPlanProgram`.
* Class scheduling, capacity management, reservations, waiting lists, attendance (reuses the existing `Visit` model rather than a second tracking pipeline).

### Employee Management

* Employee profiles
* Attendance

### Lockers

* Locker rental
* Rental tracking

Deliverables

* Full operational management

---

# Phase 3 – Commerce & Back Office

Status

* Not Started

Modules

### POS

* Sales
* Returns
* Discounts

### Inventory

* Products
* Purchases
* Stock movement

### Financials

* Expenses
* Revenues
* Cash management

### HR Expansion

* Payroll
* Shift and task support

Deliverables

* Commercial operations support

---

# Phase 4 – Advanced Access & Integrations

Status

* In Progress (RFID access control — customer demo priority)

Modules

### Device Integrations

* RFID access — **In Progress**
  * `rfidTag` field on member record
  * `POST /access/rfid` endpoint: lookup by tag, validate membership, return grant/deny, log visit
  * Turnstile/gate signal in API response (open/deny) for hardware to act on
  * Member tag assignment UI (create/edit member form)
  * Access log visible in visits list with `rfid` access method badge
* Fingerprint systems — Not Started
* Face recognition — Not Started
* Turnstiles — hardware wiring (depends on RFID sprint)
* Smart gates — Not Started

### Payments

* Regional payment gateways — Not Started
* Online payments — Not Started

### API Platform

* Public API — Not Started
* Partner integrations — Not Started

Deliverables

* Enterprise integration layer

---

# Phase 5 – Mobile Apps

Status

* Not Started

Member App

* Membership status
* Visit history
* Notifications
* Payments
* Class booking

Employee App

* Attendance
* Schedules
* Tasks

Deliverables

* Android App
* iOS App

---

# Phase 6 – Fitness Features

Status

* Not Started

Modules

### Training Programs

* Workout plans
* Exercise library
* Progress tracking

### Nutrition

* Nutrition plans
* Meal tracking

Deliverables

* Fitness management suite

---

# Phase 7 – AI Features

Status

* Not Started

Modules

### AI Assistant

* Member insights
* Attendance predictions
* Churn prediction

### AI Nutrition

* Nutrition recommendations

### AI Training

* Personalized workout suggestions

Deliverables

* Intelligent fitness platform

---

# Long-Term Vision

Create the leading gym and sports club SaaS platform in the Middle East with expansion into GCC countries and international markets.
