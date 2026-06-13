# Spark Gym ERP Web App Sprint Backlog

Version: 1.0

This document converts the MVP implementation tickets into a milestone-based backlog grouped by sprint.
It is intended to help with delivery planning, sequencing, and sprint scoping without changing product scope.

---

## Planning Assumptions

* Sprint length: 2 weeks
* Team shape: 1 frontend engineer, 1 backend engineer, 1 full-stack or shared support contributor
* Scope: MVP web application only
* Goal: Reach a pilot-ready release for one or more gym branches

This backlog is based on [Web-App-Implementation-Tickets.md](Web-App-Implementation-Tickets.md), [Web-App-Route-Map.md](Web-App-Route-Map.md), [Web-App-User-Stories.md](Web-App-User-Stories.md), and [Pilot-Workflow.md](Pilot-Workflow.md).

---

## Milestone Structure

### Milestone 1: Platform Foundation

Objective:

* Make the system usable for authenticated staff inside a tenant-aware app shell.

Included ticket groups:

* Authentication
* App shell and dashboard
* Branch setup
* Users and roles
* Settings (language configuration)

### Milestone 2: Commercial Setup

Objective:

* Let the pilot gym configure plans, register members, and sell memberships.

Included ticket groups:

* Membership plans
* Members
* Member profile
* Membership sale
* Payments

### Milestone 3: Daily Operations

Objective:

* Let front-desk staff run daily access and operational follow-up workflows.

Included ticket groups:

* Check-in
* Visits
* Notifications
* Reports

### Milestone 4: Membership Lifecycle Completion

Objective:

* Complete the MVP lifecycle with renewals, freezes, and pilot hardening.

Included ticket groups:

* Renewals
* Freezes
* Regression hardening
* Pilot-readiness validation

---

## Sprint 0: Technical Foundation

Goal:

* Prepare the project for route-based implementation work.

Non-route enabling work:

* Set up frontend project structure and authenticated app shell scaffold.
* Set up backend module structure aligned with MVP modules.
* Establish shared auth model, tenant context handling, and role guard approach.
* Set up database migration workflow.
* Define API error format and validation response structure.
* Set up base design tokens, layout primitives, and form conventions.
* Set up CI, linting, formatting, and test baseline.

Sprint exit criteria:

* The codebase is ready for feature tickets to be implemented in parallel.

---

## Sprint 1: Authentication and Core Shell

Milestone:

* Milestone 1

Tickets:

* T01 Sign In
* T02 App Shell and Dashboard

Sprint goal:

* Enable authenticated users to enter the system and navigate the core shell with tenant-safe context.

Frontend focus:

* Sign-in page
* Authenticated layout
* Left navigation and top bar
* Initial dashboard widgets

Backend focus:

* Authentication endpoint
* Current-session context
* Dashboard summary endpoints
* Role-aware route and data access foundations

Sprint exit criteria:

* Staff can sign in.
* The app shell loads correctly.
* Role-aware navigation is functional.
* Dashboard summary data is available for the correct tenant.

---

## Sprint 2: Branches, Users, and Roles

Milestone:

* Milestone 1

Tickets:

* T03 Branch List and Create Branch
* T04 Branch Details and Edit Branch
* T05 User List, Create User, and User Details
* T06 Roles Management

Sprint goal:

* Let a tenant owner create branches and staff accounts with role-based access.

Frontend focus:

* Branch list and form flows
* User administration screens
* Role display and assignment UI

Backend focus:

* Branch CRUD endpoints
* User CRUD endpoints
* Role and permission endpoints
* Branch-scoped assignment handling

Sprint exit criteria:

* A tenant can create and manage branches.
* A tenant can create staff users and assign roles.
* Role and branch scope can be enforced during navigation and data access.

---

## Sprint 2.5: Settings and Language Configuration

Milestone:

* Milestone 1

Tickets:

* T19 Settings – Language Configuration

Sprint goal:

* Let a tenant owner configure the app's default language and control which languages are visible in the language picker.

Frontend focus:

* Settings shell with section navigation
* Language settings screen: default language dropdown and per-language enable/disable toggles
* Apply language and RTL/LTR direction globally across the app shell on save

Backend focus:

* Tenant settings record: `default_language` and `enabled_languages`
* GET and PATCH settings endpoints, tenant-scoped
* Return language config in the session response so the frontend can apply it on first load

Sprint exit criteria:

* A tenant owner can set Arabic, English, or Hebrew as the default language.
* The full app shell renders in RTL for Arabic and Hebrew, and LTR for English.
* Disabled languages do not appear in the language picker.
* Tenant settings are isolated per tenant.

---

## Sprint 3: Membership Plans and Member Intake

Milestone:

* Milestone 2

Tickets:

* T07 Membership Plans List and Create Plan
* T08 Membership Plan Details and Edit Plan
* T09 Members List and Create Member

Sprint goal:

* Let staff configure plans and register members.

Frontend focus:

* Membership plan list and form flows
* Member search and filtering
* New member registration flow

Backend focus:

* Membership plan endpoints
* Member listing and creation endpoints
* Unique member number enforcement
* Plan-policy persistence and validation

Sprint exit criteria:

* Staff can create valid plans.
* Staff can register new members.
* Members and plans are isolated to the correct tenant.

---

## Sprint 4: Member Profile, Sales, and Payments

Milestone:

* Milestone 2

Tickets:

* T10 Member Profile and Edit Member
* T11 Membership Sale and Activation
* T12 Payment Entry and Payment History

Sprint goal:

* Let staff complete the commercial core flow from member registration to paid membership activation.

Frontend focus:

* Member profile with operational tabs
* Membership sale flow
* Payment entry flow
* Member-centric shortcuts for renew and freeze

Backend focus:

* Member details endpoint with related data
* Membership creation endpoint
* Payment creation and history endpoints
* Validation for active membership conflicts and payment state handling

Sprint exit criteria:

* Staff can open a member profile.
* Staff can sell a membership.
* Staff can record payment and see payment history.
* Membership and payment state are usable by later operational workflows.

---

## Sprint 5: Check-In and Visit Tracking

Milestone:

* Milestone 3

Tickets:

* T13 Check-In Screen
* T14 Visits List and Visit Details

Sprint goal:

* Let front-desk staff validate access and track visits reliably.

Frontend focus:

* High-speed QR and manual check-in UI
* Access decision states
* Visits list and filtering

Backend focus:

* Access validation service
* Visit creation endpoint
* Visits listing and details endpoints
* Enforcement of status, branch, freeze, and payment-related rules

Sprint exit criteria:

* Staff can check in valid members.
* Invalid access attempts are denied with a clear reason.
* Visits are recorded and reviewable.

---

## Sprint 6: Notifications and Reports

Milestone:

* Milestone 3

Tickets:

* T15 Notifications List and Details
* T16 Reports Home and Report Endpoints

Sprint goal:

* Give staff operational visibility and follow-up tools for membership and payment activity.

Frontend focus:

* Notification history and filters
* Reports landing page
* Active memberships, expired memberships, visits, and payments reports

Backend focus:

* Notification listing endpoints
* Report endpoints and filters
* Tenant and branch scoping on all reporting responses

Sprint exit criteria:

* Staff can review notification delivery status.
* Reports are available and trustworthy for daily operations.
* The product supports the full pilot flow except lifecycle edge cases.

---

## Sprint 7: Renewals, Freezes, and Pilot Hardening

Milestone:

* Milestone 4

Tickets:

* T17 Renew Membership
* T18 Freeze Membership

Additional stabilization work:

* Cross-route regression testing
* Role and tenant permission verification
* Workflow QA using the pilot workflow document
* Bug fixing for blockers found in end-to-end testing

Sprint goal:

* Complete the MVP membership lifecycle and harden the application for pilot release.

Frontend focus:

* Renewal flow
* Freeze flow
* Lifecycle state display improvements in member profile and check-in paths

Backend focus:

* Renewal service
* Freeze service
* Membership state transition correctness
* Regression fixes for check-in, payments, and reporting dependencies

Sprint exit criteria:

* Staff can renew memberships consistently.
* Staff can freeze eligible memberships correctly.
* Pilot workflow scenarios pass without major blockers.

---

## Recommended Definition of Done

Each ticket should satisfy all of the following before being marked done:

* Frontend route is implemented.
* Required backend endpoint or service is implemented.
* Authorization and tenant isolation are enforced.
* Validation errors are handled clearly.
* Acceptance criteria are demonstrated.
* Regression impact on member, payment, and access flows is checked.

---

## Dependency Notes

* T01 and T02 must finish before the rest of the app can be used realistically.
* T03 through T06 should finish before operational users and branch setup are considered stable.
* T07 through T12 create the minimum commercial flow needed before check-in is useful.
* T13 depends on membership, payment, and branch rules being reliable.
* T16 depends on underlying members, payments, and visits being stable enough to report on.
* T17 and T18 depend on the membership lifecycle model being fully established.

---

## Pilot Release Gate

The MVP should be considered ready for pilot release when all of the following are true:

* Staff can sign in and operate inside the correct tenant.
* A tenant can create branches and staff users.
* Staff can create plans and register members.
* Staff can sell memberships and record payments.
* Staff can check members in through QR or manual validation.
* Staff can review visits, payments, notifications, and reports.
* Staff can process renewals and freezes.
* End-to-end workflow testing passes for the pilot scenario.

---

## Document Role

This file should be used for milestone planning, sprint planning, and stakeholder delivery reviews.
If implementation tickets are reprioritized, this sprint backlog should be updated to reflect the new sequence.