# Spark Gym ERP Web App Milestone Board

Version: 1.0

This document converts the sprint backlog into a milestone board view with priority, suggested owner, and status columns.
It is intended for planning sessions, delivery reviews, and lightweight execution tracking.

---

## Status Legend

Use the following statuses consistently:

* Not Started
* Ready
* In Progress
* Blocked
* In Review
* Done

---

## Owner Legend

Execution owner labels:

* Product Owner
* Frontend Lead
* Backend Lead
* Full-Stack Lead
* QA Lead
* Shared Team

These role-based owners can be replaced with actual names later.

---

## Priority Legend

* P0: Required to keep MVP delivery moving
* P1: Important for the current milestone
* P2: Needed, but can follow after the core milestone flow is stable

---

## Kickoff Baseline

This board assumes the project is entering delivery planning.

Initial status convention used here:

* Sprint 0 enabling work is marked `Ready`.
* Sprint 1 implementation items are marked `Ready`.
* Later sprint items remain `Not Started` until the earlier dependency chain is underway.

---

## Sprint 0: Technical Foundation

Objective:

* Prepare the project structure and shared conventions before route-based feature work begins.

| ID | Item | Scope | Priority | Suggested Owner | Status | Target Sprint | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S0-01 | Frontend Project Structure and App Shell Scaffold | Enabler | P0 | Frontend Lead | Ready | Sprint 0 | Needed before route implementation |
| S0-02 | Backend Module Structure for MVP Modules | Enabler | P0 | Backend Lead | Ready | Sprint 0 | Align with tenant, member, membership, payment, and visits domains |
| S0-03 | Auth Model, Tenant Context, and Role Guard Approach | Enabler | P0 | Backend Lead | Ready | Sprint 0 | Shared foundation for route protection |
| S0-04 | Database Migration Workflow | Enabler | P0 | Backend Lead | Ready | Sprint 0 | Required before feature persistence work |
| S0-05 | API Error Format and Validation Response Standard | Enabler | P1 | Full-Stack Lead | Ready | Sprint 0 | Keeps UI validation consistent |
| S0-06 | Design Tokens, Layout Primitives, and Form Conventions | Enabler | P1 | Frontend Lead | Ready | Sprint 0 | Helps screen work stay consistent |
| S0-07 | CI, Linting, Formatting, and Test Baseline | Enabler | P0 | Shared Team | Ready | Sprint 0 | Needed before feature delivery scales |

Sprint completion check:

* The project is structurally ready for Sprint 1 feature tickets.
* Shared auth, tenant, and validation conventions are defined.
* Frontend and backend teams can implement routes in parallel.

---

## Milestone 1: Platform Foundation

Objective:

* Make the application usable for authenticated staff inside a tenant-aware shell.

| ID | Item | Scope | Priority | Suggested Owner | Status | Target Sprint | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1-01 | Sign In | T01 | P0 | Backend Lead | Ready | Sprint 1 | Required before any real app usage |
| M1-02 | App Shell and Dashboard | T02 | P0 | Frontend Lead | Ready | Sprint 1 | Depends on authenticated session context |
| M1-03 | Branch List and Create Branch | T03 | P1 | Full-Stack Lead | Not Started | Sprint 2 | Needed for tenant operations |
| M1-04 | Branch Details and Edit Branch | T04 | P1 | Full-Stack Lead | Not Started | Sprint 2 | Depends on branch list flow |
| M1-05 | User List, Create User, and User Details | T05 | P0 | Full-Stack Lead | Not Started | Sprint 2 | Required for team onboarding |
| M1-06 | Roles Management | T06 | P1 | Backend Lead | Not Started | Sprint 2 | Supports route authorization and user admin |

Milestone completion check:

* Staff can sign in.
* Tenant owner can create branches.
* Tenant owner can create staff users and roles are enforceable.
* App shell navigation behaves correctly by role.

---

## Milestone 2: Commercial Setup

Objective:

* Let the pilot gym configure plans, register members, and complete membership sales with payment recording.

| ID | Item | Scope | Priority | Suggested Owner | Status | Target Sprint | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M2-01 | Membership Plans List and Create Plan | T07 | P0 | Full-Stack Lead | Not Started | Sprint 3 | Required before sales flow |
| M2-02 | Membership Plan Details and Edit Plan | T08 | P1 | Full-Stack Lead | Not Started | Sprint 3 | Must preserve historical integrity |
| M2-03 | Members List and Create Member | T09 | P0 | Full-Stack Lead | Not Started | Sprint 3 | Core intake flow |
| M2-04 | Member Profile and Edit Member | T10 | P0 | Frontend Lead | Not Started | Sprint 4 | Central operational screen |
| M2-05 | Membership Sale and Activation | T11 | P0 | Backend Lead | Not Started | Sprint 4 | Depends on plans and member profile |
| M2-06 | Payment Entry and Payment History | T12 | P0 | Full-Stack Lead | Not Started | Sprint 4 | Needed before operational access flow |

Milestone completion check:

* Staff can create plans.
* Staff can register members.
* Staff can sell memberships.
* Staff can record payments and view payment history.

---

## Milestone 3: Daily Operations

Objective:

* Let front-desk staff run the gym operationally through check-in, visit tracking, notifications, and reports.

| ID | Item | Scope | Priority | Suggested Owner | Status | Target Sprint | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M3-01 | Check-In Screen | T13 | P0 | Full-Stack Lead | Not Started | Sprint 5 | High-speed operational route |
| M3-02 | Visits List and Visit Details | T14 | P1 | Full-Stack Lead | Not Started | Sprint 5 | Depends on visit creation flow |
| M3-03 | Notifications List and Details | T15 | P2 | Frontend Lead | Not Started | Sprint 6 | Follows communication logging support |
| M3-04 | Reports Home and Report Endpoints | T16 | P1 | Backend Lead | Not Started | Sprint 6 | Requires stable operational data |

Milestone completion check:

* Staff can check members in.
* Staff can review visits.
* Staff can track notification delivery status.
* Staff can use core operational reports.

---

## Milestone 4: Membership Lifecycle Completion

Objective:

* Complete the membership lifecycle with renewals, freezes, and pilot hardening.

| ID | Item | Scope | Priority | Suggested Owner | Status | Target Sprint | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M4-01 | Renew Membership | T17 | P0 | Backend Lead | Not Started | Sprint 7 | Must preserve membership history |
| M4-02 | Freeze Membership | T18 | P0 | Backend Lead | Not Started | Sprint 7 | Must enforce plan freeze policy |
| M4-03 | Regression and Permission Verification | Stabilization | P0 | QA Lead | Not Started | Sprint 7 | End-to-end workflow validation |
| M4-04 | Pilot Workflow QA | Stabilization | P0 | Shared Team | Not Started | Sprint 7 | Validate full pilot scenario |
| M4-05 | Pilot Blocker Fixes | Stabilization | P0 | Shared Team | Not Started | Sprint 7 | Reserve capacity for final issues |

Milestone completion check:

* Staff can renew memberships.
* Staff can freeze eligible memberships.
* End-to-end pilot workflow passes.
* No major blockers remain for pilot release.

---

## Cross-Cutting Board Items

These items should be tracked across multiple milestones even though they do not belong to a single feature route.

| ID | Item | Priority | Suggested Owner | Status | Start Sprint | End Sprint | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-01 | Tenant Isolation Enforcement | P0 | Backend Lead | Ready | Sprint 1 | Sprint 7 | Applies to every route and endpoint |
| X-02 | Role and Branch Authorization | P0 | Backend Lead | Ready | Sprint 1 | Sprint 7 | Must be validated continuously |
| X-03 | Audit Trail Coverage | P1 | Backend Lead | Not Started | Sprint 2 | Sprint 7 | Focus on member, membership, payment, and freeze actions |
| X-04 | Form Validation Quality | P1 | Frontend Lead | Ready | Sprint 1 | Sprint 7 | Front-desk clarity matters |
| X-05 | RTL and Multilingual Readiness | P2 | Frontend Lead | Ready | Sprint 1 | Sprint 7 | Keep structure ready even if copy is incomplete |
| X-06 | Acceptance and Regression Testing | P0 | QA Lead | Not Started | Sprint 2 | Sprint 7 | Needed before pilot release |

---

## Board Review Rhythm

Recommended planning rhythm:

* Review milestone status at the start and end of each sprint.
* Move items from Not Started to Ready before sprint planning.
* Keep only actively worked items in In Progress.
* Use Blocked only when an external dependency or unresolved defect is stopping progress.
* Use In Review for items awaiting demo, QA, or approval.

---

## Suggested Next Update

When the team structure is finalized, replace the role-based owners with actual names.
When Sprint 0 starts, move Sprint 0 items from `Ready` to `In Progress` as they begin.
When Sprint 1 starts, move `M1-01`, `M1-02`, `X-01`, `X-02`, `X-04`, and `X-05` into `In Progress` as active work begins.

---

## Document Role

This file should be used as the lightweight milestone board for MVP planning and delivery tracking.
If sprint sequencing or scope changes, this board should be updated to stay consistent with the sprint backlog and implementation tickets.