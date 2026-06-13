# Spark Gym ERP Pilot Workflow

Version: 1.0

This document describes the end-to-end MVP operational workflow for a pilot gym.
It translates product requirements and business rules into the daily sequence that staff should be able to complete in the first release.

---

## Purpose

The pilot workflow defines how a gym should use the MVP from initial setup through ongoing member access.
It is intended to help with:

* Product scoping
* UX planning
* Backend workflow design
* QA scenarios
* Pilot customer onboarding

---

## Actors

* Tenant owner
* Branch manager
* Front desk staff
* Finance or cashier role
* Member

---

## MVP Workflow Overview

The pilot-ready operational flow is:

1. Tenant onboarding
2. Branch setup
3. Staff user setup
4. Membership plan setup
5. Member registration
6. Membership sale or activation
7. Payment recording
8. Notification delivery
9. Member check-in
10. Visit and payment review

---

## 1. Tenant Onboarding

Primary actor: Tenant owner

Steps:

1. Create the tenant account.
2. Enter tenant-level identity and account details.
3. Save the tenant as the root owner of all branches, users, members, memberships, visits, and payments.

Expected outcome:

* A new tenant exists.
* Tenant data is isolated from other tenants.

Rules:

* All future records must belong to this tenant.
* Users from other tenants must not see this tenant's data.

---

## 2. Branch Setup

Primary actor: Tenant owner or branch manager

Steps:

1. Create one or more branches under the tenant.
2. Enter branch name, code, contact details, and operational settings.
3. Mark the branch as active when it is ready for use.

Expected outcome:

* At least one active branch is available for staff and member operations.

Rules:

* Every branch must belong to exactly one tenant.
* Branch activity must remain scoped to the owning tenant.

---

## 3. Staff User Setup

Primary actor: Tenant owner

Steps:

1. Create staff users.
2. Assign roles such as owner, branch manager, front desk, or finance.
3. Assign branch-scoped access where needed.
4. Activate the user account.

Expected outcome:

* Authorized staff can sign in and operate only within their allowed scope.

Rules:

* Every user must belong to one tenant.
* Role assignment must control operational access.
* Important user and role changes should be auditable.

---

## 4. Membership Plan Setup

Primary actor: Tenant owner or branch manager

Steps:

1. Create a membership plan.
2. Define whether the plan is duration-based, session-based, or both.
3. Define price, duration, session count, branch availability, and freeze policy.
4. Save the plan for future sales and renewals.

Expected outcome:

* Staff can sell memberships using consistent plan definitions.

Rules:

* Each plan belongs to one tenant.
* Plan changes must not silently rewrite historical memberships.
* Freeze settings must be defined before freeze is allowed.

---

## 5. Member Registration

Primary actor: Front desk staff or branch manager

Steps:

1. Create a new member profile.
2. Enter member number, full name, contact details, home branch, and status.
3. Add emergency contact details.
4. Add medical notes if relevant.
5. Save the member profile.

Expected outcome:

* The member exists in the tenant and is ready for membership activation.

Rules:

* Member number must be unique within the tenant.
* Every member must have a home branch.
* Historical data must remain intact even if the profile later becomes inactive.

---

## 6. Membership Sale and Activation

Primary actor: Front desk staff or finance role

Steps:

1. Select the member.
2. Choose the appropriate membership plan.
3. Confirm start date, end date, branch eligibility, and price.
4. Create the membership record.
5. Mark the membership status according to activation timing.

Expected outcome:

* The member has a valid upcoming or active membership.

Rules:

* A membership must belong to one member and one plan.
* The recommended MVP behavior is one active operational membership per member at a time.
* A membership should not be active before its effective start date.

---

## 7. Payment Recording

Primary actor: Finance role or front desk staff

Steps:

1. Open the membership sale or renewal transaction.
2. Record the payment amount, date, method, status, and reference number if available.
3. Link the payment to the member and related membership.
4. Save the payment.

Expected outcome:

* Payment history is visible and tied to the correct member and membership.

Rules:

* Zero or negative amounts must not be accepted as standard payments.
* Only paid payments should count as completed revenue.
* Pending or failed payments must not grant access unless tenant policy allows grace handling.

---

## 8. Notification Delivery

Primary actor: System with staff-triggered actions where needed

Triggers:

* New membership created
* Renewal due soon
* Membership expired
* Payment follow-up needed

Steps:

1. Generate the relevant notification.
2. Choose channel based on tenant configuration.
3. Send through SMS, WhatsApp, or email.
4. Store delivery status.

Expected outcome:

* Operational communication is visible and trackable.

Rules:

* Notification failure must not silently change payment or membership status.
* Delivery status should remain visible for follow-up.

---

## 9. Member Check-In Workflow

Primary actor: Member with front desk staff support

Entry methods:

* QR check-in
* Manual validation by staff

Steps:

1. Identify the member by QR or staff search.
2. Load the member's current active membership state.
3. Validate whether the membership is active and valid for the branch.
4. Confirm that freeze, expiry, cancellation, and payment policy do not block access.
5. If valid, create a visit record with branch, check-in time, and access method.
6. If invalid, deny access and show the reason to authorized staff.

Expected outcome:

* Valid members are checked in successfully.
* Invalid access attempts are rejected consistently.

Rules:

* Access must be denied for expired, frozen, and cancelled memberships.
* Access must be denied if branch rules are not satisfied.
* Manual validation must remain available when QR cannot be used.
* Duplicate or suspicious repeated check-ins may be flagged according to branch policy.

---

## 10. Visit Review and Operational Follow-Up

Primary actor: Branch manager or front desk staff

Steps:

1. View recent visits for the branch.
2. Review denied access attempts when available.
3. Review memberships approaching expiration.
4. Review payment activity and outstanding follow-up cases.
5. Trigger manual communication when needed.

Expected outcome:

* Staff can manage the branch using current operational visibility.

Reports used:

* Active memberships report
* Expired memberships report
* Visit report
* Payment summary report

---

## 11. Renewal Workflow

Primary actor: Front desk staff or finance role

Steps:

1. Find a membership that is near expiration or already expired.
2. Select a plan for renewal.
3. Create the new membership record using the chosen renewal policy.
4. Record the payment.
5. Notify the member if needed.

Expected outcome:

* The member remains operationally active without losing historical traceability.

Rules:

* The recommended MVP behavior is to create a new membership record for each renewal.
* Renewal handling must be consistent across the product.

---

## 12. Freeze Workflow

Primary actor: Branch manager or authorized staff

Steps:

1. Open the member's active membership.
2. Confirm that the membership plan allows freeze.
3. Enter freeze dates and reason.
4. Save the freeze record.
5. Update the membership's operational status for the freeze period.

Expected outcome:

* The membership is temporarily invalid for access during the approved freeze period.

Rules:

* Expired or cancelled memberships must not be frozen.
* Freeze duration must not exceed plan allowance.
* Freeze history must remain visible.

---

## Exception Cases

### Payment not completed

* Membership may exist in draft or pending operational state.
* Access should remain blocked unless tenant policy explicitly allows grace access.

### Member attempts access at the wrong branch

* Access must be denied unless the plan supports all branches or the specific branch.

### QR unavailable at front desk

* Staff must be able to fall back to manual validation.

### Membership expired today

* Validation should follow exact tenant date/time policy, but the behavior must be consistent across all branches.

---

## Acceptance Criteria for Pilot Readiness

The pilot workflow is considered supported when a gym can complete all of the following inside the product:

* Create a tenant and branch
* Create staff users with roles
* Create membership plans
* Register a member
* Activate a membership
* Record a payment
* Send or log an operational notification
* Check the member in through QR or manual validation
* Review visit and payment activity
* Process renewals and freezes according to policy

---

## Document Role

This file should be used when designing screens, APIs, service flows, and test scenarios for the first pilot release.
If a workflow decision conflicts with broad planning language, the MVP requirements and business rules remain the controlling documents.