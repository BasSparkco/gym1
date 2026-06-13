# Spark Gym ERP MVP Requirements

Version: 1.0

This document defines the canonical MVP requirements for the first pilot-ready release.
It should be used as the source of truth when roadmap, proposal, or feature discussions become too broad.

---

## Product Goal

Deliver a web-based SaaS MVP for gyms and fitness centers that covers the core daily operational workflow:

* Set up a tenant and one or more branches
* Manage staff access to the system
* Register and manage members
* Sell and renew memberships
* Record visits using QR or manual validation
* Track membership payments
* Send operational notifications
* View core business reports

---

## Target Launch Segment

The MVP is designed for:

* Gyms
* Fitness centers
* Women's fitness centers
* Multi-branch fitness operators

The MVP is not optimized for martial arts academies, swimming clubs, or broader sports-club workflows.
Those remain later-phase expansion markets.

---

## Product Boundaries

The MVP includes:

* Web application only
* Multi-tenant support
* Multi-branch support
* Arabic, English, and Hebrew language support with full RTL layout
* Per-tenant language configuration: default language and visible language options
* QR and manual access flows
* Membership payment tracking

The MVP does not include:

* Face recognition
* Fingerprint devices
* RFID integration
* Turnstiles and smart gates
* Payroll
* POS
* Accounting
* Nutrition planning
* Training programs
* Mobile apps
* AI features

See [later.md](later.md) for deferred scope.

---

## Primary Users

* Tenant owner
* Branch manager
* Front desk staff
* Finance or cashier role

Members are part of the managed data model, but the MVP does not include a member self-service portal or mobile app.

---

## Functional Requirements

### 1. Tenant and Branch Setup

The system must allow:

* Creating a tenant account
* Creating one or more branches under a tenant
* Storing branch contact and operational information
* Limiting data visibility by tenant

### 2. Authentication and Permissions

The system must allow:

* User authentication
* Role-based access control
* Branch-scoped role assignment when needed
* Audit logging for important system actions

### 3. Member Management

The system must allow:

* Creating and updating member profiles
* Storing contact information
* Storing emergency contact details
* Storing medical notes
* Tracking member status
* Assigning a home branch to a member

### 4. Membership Plans and Memberships

The system must allow:

* Creating membership plans
* Supporting duration-based plans
* Supporting session-based plans
* Activating a membership for a member
* Renewing memberships
* Freezing memberships when allowed by the plan
* Tracking active, frozen, expired, and cancelled membership states

### 5. Payments

The system must allow:

* Recording membership-related payments
* Storing amount, date, reference, status, and method
* Linking payments to a member and membership
* Viewing payment history

Online payment gateways are outside MVP scope.

### 6. Visit Tracking and Access

The system must allow:

* Manual check-in
* QR-based check-in
* Check-out tracking when used by the branch
* Recording access method for each visit
* Preventing invalid access based on membership status and branch rules
* Viewing visit history by member and branch

Physical device integrations are outside MVP scope.

### 7. Notifications

The system must allow:

* Sending operational notifications through SMS, WhatsApp, and email
* Triggering reminders for membership expiration and renewal follow-up
* Storing notification delivery status

Push notifications are outside MVP scope.

### 8. Reporting

The system must provide:

* Active memberships report
* Expired memberships report
* Visit report
* Payment summary report

Advanced BI and analytics are outside MVP scope.

### 9. Settings

The system must allow a tenant owner or admin to:

* Select the default application language (English, Arabic, or Hebrew)
* Control which languages are available in the language picker shown to users
* Enable or disable individual languages per tenant (e.g., an Arabic-language gym may choose to hide Hebrew from the UI entirely)

The application must apply the correct text direction (LTR or RTL) based on the active language.
The settings page must itself render correctly in the selected default language and direction.

---

## Core Business Rules

* A user must belong to a tenant.
* A branch must belong to a single tenant.
* A member must belong to a tenant and have a home branch.
* A membership must belong to one member and one plan.
* A payment must be linked to a member and should be linked to the related membership when applicable.
* A member may have multiple memberships historically, but branch rules must define whether more than one active membership is allowed at the same time.
* Access must be denied when the membership is expired, cancelled, or otherwise invalid for entry.
* Membership freeze must only be allowed when the assigned plan supports it.

---

## Non-Functional Requirements

* Tenant data must be logically isolated.
* The system must support multiple branches under one tenant.
* The first release must be usable as a pilot-ready web product.
* The design should allow later expansion without major database redesign.
* Audit-sensitive actions should be traceable.
* The UI must support full right-to-left layout for Arabic and Hebrew from the initial release.
* Language and direction switching must apply globally to the entire app shell without requiring a page reload.

---

## MVP Success Criteria

The MVP is successful if a pilot gym can:

* Onboard as a tenant
* Configure at least one branch
* Create staff users with roles
* Create membership plans
* Register members
* Sell or renew memberships
* Record payments
* Check members in using QR or manual validation
* Review visits and payment activity
* Receive and manage basic operational notifications

---

## Out of Scope for MVP

The following are intentionally excluded from the first release:

* Advanced hardware integrations
* Payroll and advanced HR workflows
* POS and inventory
* Accounting and tax workflows
* Mobile applications
* Training and nutrition modules
* Martial arts-specific workflows
* AI recommendations and automation
* Public partner ecosystem

---

## Document Role

When other planning documents are updated, they should remain consistent with this MVP requirements document.
If scope conflicts appear, this file should be used to resolve MVP scope first.