# Spark Gym ERP Web App Route Map

Version: 1.0

This document defines the MVP information architecture and route structure for the web application.
It translates the screen-level user stories into a practical navigation model that frontend and backend teams can build against.

---

## Purpose

This document is intended to support:

* Navigation design
* Route planning
* Permission-aware UI structure
* Layout decisions
* Frontend implementation sequencing

It should remain aligned with [Web-App-User-Stories.md](Web-App-User-Stories.md), [Pilot-Workflow.md](Pilot-Workflow.md), and [MVP-Requirements.md](MVP-Requirements.md).

---

## MVP Information Architecture

The MVP web app should be organized into the following primary navigation groups:

* Authentication
* Dashboard
* Branch Setup
* User and Access Management
* Membership Configuration
* Member Operations
* Check-In and Visits
* Notifications
* Reporting

The IA should optimize for daily front-desk operations rather than full enterprise administration.

---

## Navigation Model

### Public Area

* Sign in

### Authenticated App Shell

Primary navigation:

* Dashboard
* Branches
* Users & Roles
* Membership Plans
* Members
* Check-In
* Visits
* Notifications
* Reports
* Settings

Contextual actions:

* Create member
* Start membership sale
* Record payment
* Renew membership
* Freeze membership

Profile and session actions:

* Current branch context
* Current user
* Sign out

---

## Route Tree

Suggested MVP route structure:

```text
/signin

/app
/app/dashboard

/app/branches
/app/branches/new
/app/branches/:branchId
/app/branches/:branchId/edit

/app/users
/app/users/new
/app/users/:userId
/app/users/:userId/edit
/app/roles

/app/membership-plans
/app/membership-plans/new
/app/membership-plans/:planId
/app/membership-plans/:planId/edit

/app/members
/app/members/new
/app/members/:memberId
/app/members/:memberId/edit
/app/members/:memberId/memberships/new
/app/members/:memberId/payments/new
/app/members/:memberId/renew
/app/members/:memberId/freeze

/app/check-in
/app/visits
/app/visits/:visitId

/app/notifications
/app/notifications/:notificationId

/app/reports
/app/reports/active-memberships
/app/reports/expired-memberships
/app/reports/visits
/app/reports/payments

/app/settings
/app/settings/language
```

---

## Route Design Principles

* Use a single authenticated app shell under `/app`.
* Keep operational actions close to the member context.
* Prefer shallow, readable routes over deeply nested admin paths.
* Use route-level authorization to hide or block unauthorized pages.
* Preserve branch context across operational routes where possible.

---

## Screen-to-Route Mapping

### 1. Authentication

* Sign in: `/signin`

### 2. Dashboard

* Dashboard: `/app/dashboard`

### 3. Branch Management

* Branch list: `/app/branches`
* New branch: `/app/branches/new`
* Branch details: `/app/branches/:branchId`
* Edit branch: `/app/branches/:branchId/edit`

### 4. Staff Users and Roles

* User list: `/app/users`
* New user: `/app/users/new`
* User details: `/app/users/:userId`
* Edit user: `/app/users/:userId/edit`
* Roles: `/app/roles`

### 5. Membership Plans

* Plan list: `/app/membership-plans`
* New plan: `/app/membership-plans/new`
* Plan details: `/app/membership-plans/:planId`
* Edit plan: `/app/membership-plans/:planId/edit`

### 6. Member Operations

* Member list: `/app/members`
* New member: `/app/members/new`
* Member profile: `/app/members/:memberId`
* Edit member: `/app/members/:memberId/edit`

### 7. Membership Sale, Payment, Renewal, Freeze

* New membership sale: `/app/members/:memberId/memberships/new`
* New payment: `/app/members/:memberId/payments/new`
* Renew membership: `/app/members/:memberId/renew`
* Freeze membership: `/app/members/:memberId/freeze`

### 8. Check-In and Visits

* Check-in: `/app/check-in`
* Visits list: `/app/visits`
* Visit details: `/app/visits/:visitId`

### 9. Notifications

* Notification list: `/app/notifications`
* Notification details: `/app/notifications/:notificationId`

### 10. Reports

* Reports home: `/app/reports`
* Active memberships report: `/app/reports/active-memberships`
* Expired memberships report: `/app/reports/expired-memberships`
* Visits report: `/app/reports/visits`
* Payments report: `/app/reports/payments`

### 11. Settings

* Settings home: `/app/settings`
* Language settings: `/app/settings/language`

The language settings screen allows the tenant owner or admin to:

* Select the default application language (English, Arabic, or Hebrew)
* Choose which languages appear in the language picker shown across the app
* Individually enable or disable each of the three supported languages
* Preview how the label appears in each language to aid selection

This screen must render correctly in the current active language and text direction.

---

## Role-Aware Navigation

### Tenant Owner

Should see:

* Dashboard
* Branches
* Users & Roles
* Membership Plans
* Members
* Visits
* Notifications
* Reports
* Settings

### Branch Manager

Should see:

* Dashboard
* Branches
* Membership Plans
* Members
* Check-In
* Visits
* Notifications
* Reports

May have limited or no access to user administration depending on tenant policy.

### Front Desk Staff

Should see:

* Dashboard
* Members
* Check-In
* Visits
* Notifications

May also access membership sale, payment entry, renew, and freeze flows if authorized.

### Finance or Cashier Role

Should see:

* Dashboard
* Members
* Payment-related actions
* Reports

May have read-only access to operational member data outside financial workflows.

---

## Recommended App Shell Layout

### Left Navigation

Persistent navigation for primary modules:

* Dashboard
* Branches
* Users & Roles
* Membership Plans
* Members
* Check-In
* Visits
* Notifications
* Reports
* Settings

### Top Bar

Context and utility actions:

* Selected branch context
* Search shortcut
* Current user
* Sign out

### Page Header

Per-screen actions:

* Create member
* Create branch
* Create plan
* Record payment
* Renew membership
* Freeze membership

---

## Operational Shortcuts

The following actions should be easy to access from multiple screens:

* New member
* Sell membership
* Record payment
* Check in member
* Renew membership
* Freeze membership

These shortcuts are important because the MVP is optimized for staff speed at the front desk.

---

## Member-Centric Subnavigation

Within the member profile, the UI should expose member-focused sections rather than sending the user back to the global menu for every task.

Suggested sub-sections:

* Overview
* Memberships
* Payments
* Visits
* Notifications

Suggested member actions:

* Edit member
* New membership sale
* Record payment
* Renew membership
* Freeze membership

---

## Breadcrumb Guidance

Use breadcrumbs for detail and workflow routes.

Examples:

* Members / Ahmed Ali
* Members / Ahmed Ali / New Membership
* Members / Ahmed Ali / New Payment
* Branches / Ramallah Branch / Edit
* Reports / Active Memberships

---

## Route Guard Rules

* Unauthenticated users may only access public authentication routes.
* Authenticated users must be redirected away from public auth routes.
* Tenant boundaries must be enforced on all `/app` routes.
* Role checks must be enforced before rendering sensitive pages.
* Branch-scoped restrictions must affect member, visit, and payment routes where applicable.

---

## Reporting IA

The reports area should use one landing page with clear report cards or tabs for:

* Active memberships
* Expired memberships
* Visits
* Payments

This avoids scattering reports across unrelated modules.

---

## Check-In IA

The check-in experience should be optimized as a high-speed operational screen.

Recommended structure:

* QR input or scan area
* Manual member search
* Member result summary
* Access decision state
* Last visits or recent actions

This screen should minimize navigation friction and unnecessary form complexity.

---

## Suggested Build Sequence by Route

1. `/signin`
2. `/app/dashboard`
3. `/app/branches`
4. `/app/users` and `/app/roles`
5. `/app/settings/language`
6. `/app/membership-plans`
7. `/app/members` and `/app/members/new`
8. `/app/members/:memberId`
9. `/app/members/:memberId/memberships/new`
10. `/app/members/:memberId/payments/new`
11. `/app/check-in`
12. `/app/visits`
13. `/app/notifications`
14. `/app/reports`
15. `/app/members/:memberId/renew`
16. `/app/members/:memberId/freeze`

Settings is placed early in the build sequence because the language and RTL direction preference affects every screen that follows.

---

## Document Role

This file should be used as the route-planning and navigation reference for the MVP web app.
If screen stories evolve, the routes and IA should be updated here so implementation remains consistent.