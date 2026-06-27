# ROADMAP.md

# Spark Gym ERP Roadmap

This roadmap separates MVP scope from later-phase expansion so the first release stays realistic and operationally useful.

Development Standard

* pnpm is the default package manager for project setup, dependency installation, and workspace scripts.

Current Status Snapshot

* Overall status: In Progress
* Phase 0 status: In Progress
* Phase 1 status: Started
* Phase 2 and later: Not Started

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

Current next focus

* **Phase 4 — RFID access control** (customer priority for demo): add RFID tag to member profiles, dedicated `POST /access/rfid` endpoint, turnstile grant/deny signal, access log, and member tag assignment UI. Phases 2 and 3 deferred until after the demo and real-data pilot.

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

* Not Started

Modules

### Classes

* Class scheduling
* Capacity management
* Reservations

### Employee Management

* Employee profiles
* Attendance

### Lockers

* Locker rental
* Rental tracking

### Class Management

* Class scheduling
* Capacity management
* Reservations

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
