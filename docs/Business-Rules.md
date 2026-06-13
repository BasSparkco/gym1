# Spark Gym ERP Business Rules

Version: 1.0

This document defines the operational business rules for the MVP.
It complements [MVP-Requirements.md](MVP-Requirements.md) by describing how core workflows should behave in edge cases and day-to-day operations.

---

## Scope

This document covers MVP business rules for:

* Member lifecycle
* Membership activation and renewal
* Membership freeze handling
* Payment states and payment recording
* Visit validation and access control
* Tenant and branch data boundaries

Items outside the MVP remain governed by later planning documents and should not override the rules here.

---

## 1. Tenant and Branch Rules

* Every branch must belong to exactly one tenant.
* Every user must belong to exactly one tenant.
* Every member must belong to exactly one tenant.
* Users may be restricted to one branch or allowed to operate across multiple branches depending on their assigned roles.
* A user must not be able to view or modify data from another tenant.
* A branch may only manage members, visits, and payments that belong to its own tenant.

---

## 2. Member Rules

* Every member must have a unique member number within the tenant.
* Every member must have a home branch.
* A member may visit branches other than the home branch only when the active membership plan allows it.
* A member profile may be marked inactive without deleting historical visits, memberships, payments, or notifications.
* Medical notes and emergency contacts are operational data and must remain visible to authorized staff.

---

## 3. Membership Plan Rules

* Every membership plan must belong to a tenant.
* A membership plan must define whether it is duration-based, session-based, or both.
* A membership plan must define whether freeze is allowed.
* If freeze is allowed, the plan must define the maximum freeze days or freeze policy.
* A membership plan may be limited to one branch or may allow all branches within the tenant.
* Changes to a plan must not retroactively alter historical memberships unless an explicit migration operation is performed.

---

## 4. Membership Activation Rules

* A membership must belong to exactly one member.
* A membership must be created from exactly one membership plan.
* A membership must have a start date and an end date.
* A membership may not be activated without a valid member record.
* A membership should not become active before the effective start date.
* A membership becomes expired when the end date passes and no valid extension or renewal applies.
* The system should define whether multiple active memberships for the same member are allowed. The default MVP rule is that only one active operational membership is allowed at a time per member.

Membership status should follow these operational meanings:

* Draft: Created but not yet active.
* Active: Valid for visits, subject to branch rules and payment state.
* Frozen: Temporarily not valid for visits during the freeze period.
* Expired: End date passed with no active extension.
* Cancelled: Ended administratively and no longer valid for visits.

---

## 5. Membership Renewal Rules

* Renewal may create a new membership record or extend the existing one, but the implementation must be consistent across the product.
* The recommended MVP rule is to create a new membership record for each renewal to preserve billing and historical clarity.
* A renewed membership must preserve a traceable relationship to the prior membership when possible.
* Renewal before expiration may either extend continuity from the current end date or start immediately, based on tenant policy.
* Renewal after expiration starts a new active period from the chosen renewal date.
* Expiration reminders may be sent before the end date according to notification policy.

---

## 6. Membership Freeze Rules

* A membership may only be frozen if the assigned plan allows freeze.
* A freeze must have a start date and end date.
* A freeze must not exceed the maximum freeze allowance defined by the plan.
* A frozen membership must not be valid for access during the freeze period.
* The effective membership end date may be extended according to the approved freeze duration if tenant policy allows it.
* Freeze history must remain visible for audit and customer support purposes.
* A cancelled or expired membership must not be frozen.

---

## 7. Payment Rules

* A payment must belong to a member.
* A payment should be linked to the related membership whenever the payment is membership-related.
* A payment must record amount, payment date, status, and payment method.
* A payment reference should be stored when provided by the operator or payment channel.
* A zero or negative payment amount must not be accepted as a normal payment record.
* A payment may be recorded even if the membership has not yet started, as long as it relates to a valid upcoming membership.

Recommended MVP payment states:

* Pending: Payment initiated but not yet confirmed.
* Paid: Payment confirmed and counted as received.
* Failed: Payment attempt did not succeed.
* Refunded: Payment was reversed in whole or in part.
* Cancelled: Payment was voided before completion.

Operational rules:

* Only paid payments should count toward completed revenue for operational reporting.
* Pending or failed payments must not grant access unless tenant policy explicitly supports temporary grace access.
* Refunds must remain historically visible and must not delete the original payment trail.

---

## 8. Access Validation Rules

* Every visit attempt must be evaluated against membership validity.
* Access may be granted only when the member has a valid active membership for the target branch.
* Access must be denied when the membership is expired, cancelled, or frozen.
* Access must be denied when the plan does not allow the target branch.
* Access may be denied when payment state or outstanding balance violates tenant policy.
* Access method must be recorded for each visit, such as QR or manual validation.
* Duplicate or suspicious repeated check-ins within a short period should be flagged according to branch policy.
* Manual validation must be available when QR is unavailable or operationally unsuitable.

---

## 9. Visit Rules

* A visit must belong to one member and one branch.
* A visit must record the check-in time.
* Check-out time is optional unless the branch workflow requires it.
* Visit history must remain immutable except for authorized corrections.
* Authorized staff may correct visit data, but corrections should be auditable.

---

## 10. Notification Rules

* Notifications may be triggered for membership creation, renewal follow-up, expiration reminders, and operational alerts.
* Notification delivery status should be stored.
* A failed notification must not change membership or payment status by itself.
* Notification content should be derived from approved templates or controlled message logic.

---

## 11. Audit Rules

* Important actions should be auditable.
* At minimum, the MVP should audit membership creation, renewal, freeze actions, payment recording, and major member updates.
* Audit records must not be silently deleted during normal operations.

---

## 12. Recommended Defaults for MVP

These defaults are recommended unless product policy changes them later:

* One active operational membership per member at a time.
* Renewal creates a new membership record instead of mutating historical records.
* Access is blocked for expired, frozen, and cancelled memberships.
* Access is allowed only for the correct branch unless the plan supports all branches.
* Only paid payments count as completed payment for access-sensitive logic.
* QR and manual validation are the only supported access methods in MVP.

---

## Document Role

If an implementation decision conflicts with general planning language in the roadmap or proposal, this document should guide the MVP operational behavior until a newer version is approved.