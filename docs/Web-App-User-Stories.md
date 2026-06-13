# Spark Gym ERP Web App User Stories

Version: 1.0

This document translates the MVP requirements and pilot workflow into screen-by-screen user stories for the web application.
It is intended to guide product design, UI planning, implementation sequencing, and QA scenario definition.

---

## Scope

This document covers only MVP web screens and workflows.
It does not include mobile apps, hardware device screens, POS, accounting, payroll, or AI features.

---

## Roles

* Tenant owner
* Branch manager
* Front desk staff
* Finance or cashier role

---

## Screen Map

The MVP web app should include the following core screens:

1. Sign in
2. Dashboard
3. Branch management
4. Staff users and roles
5. Membership plans
6. Member list
7. Member profile
8. New member form
9. Membership sale and activation
10. Payment entry and payment history
11. Check-in screen
12. Visits screen
13. Notifications screen
14. Reports screen
15. Renewal flow
16. Freeze flow

---

## 1. Sign In Screen

Primary users:

* Tenant owner
* Branch manager
* Front desk staff
* Finance or cashier role

User stories:

* As a staff user, I want to sign in securely so I can access only my tenant's data.
* As a tenant owner, I want my users restricted by role so each user sees only the tools they are allowed to use.

Key requirements:

* User authentication
* Tenant-safe access
* Role-based entry into the application

---

## 2. Dashboard Screen

Primary users:

* Tenant owner
* Branch manager
* Front desk staff

User stories:

* As a branch manager, I want a quick operational summary so I can see what needs attention today.
* As a front desk user, I want to see expiring memberships and recent visits so I can act quickly.

Key widgets:

* Active memberships summary
* Expired memberships summary
* Recent visits
* Payment summary snapshot
* Renewal follow-up indicators

---

## 3. Branch Management Screen

Primary users:

* Tenant owner
* Branch manager

User stories:

* As a tenant owner, I want to create and manage branches so my organization can operate in multiple locations.
* As a branch manager, I want to update branch details so staff use correct operational information.

Key actions:

* Create branch
* Edit branch details
* Activate or deactivate branch
* View branch configuration

Rules:

* A branch must belong to one tenant.
* Users must not manage branches outside their tenant.

---

## 4. Staff Users and Roles Screen

Primary users:

* Tenant owner

User stories:

* As a tenant owner, I want to create staff users so my team can use the system.
* As a tenant owner, I want to assign roles and branch scope so users only access the parts of the system they need.

Key actions:

* Create user
* Assign role
* Assign branch scope
* Activate or deactivate user

Rules:

* Each user belongs to one tenant.
* Important access changes should be auditable.

---

## 5. Membership Plans Screen

Primary users:

* Tenant owner
* Branch manager

User stories:

* As an operator, I want to create membership plans so staff can sell memberships consistently.
* As an operator, I want to define freeze and branch rules so access behavior follows business policy.

Key actions:

* Create plan
* Edit plan
* Set duration or session count
* Set price
* Set branch access rules
* Set freeze policy

Rules:

* A plan belongs to one tenant.
* Plan edits must not silently rewrite historical memberships.

---

## 6. Member List Screen

Primary users:

* Branch manager
* Front desk staff

User stories:

* As a front desk user, I want to search members quickly so I can serve them without delay.
* As a branch manager, I want to filter members by status so I can manage active and inactive records efficiently.

Key actions:

* Search by member number, name, phone, or status
* Filter by branch or status
* Open member profile
* Start new membership sale

---

## 7. Member Profile Screen

Primary users:

* Branch manager
* Front desk staff
* Finance or cashier role

User stories:

* As a front desk user, I want to view the member's current status and active membership so I can handle visits and renewals correctly.
* As a finance user, I want to see payment history from the member profile so I can resolve payment questions quickly.

Key sections:

* Personal details
* Home branch
* Emergency contact
* Medical notes
* Membership history
* Payment history
* Visit history
* Notification history

---

## 8. New Member Form Screen

Primary users:

* Front desk staff
* Branch manager

User stories:

* As a front desk user, I want to register a new member quickly so I can start the sales process immediately.
* As an operator, I want required fields enforced so incomplete member records do not block later workflows.

Key fields:

* Member number
* Full name
* Mobile
* Email
* Home branch
* Status
* Emergency contact
* Medical notes

Rules:

* Member number must be unique within the tenant.
* Every member must have a home branch.

---

## 9. Membership Sale and Activation Screen

Primary users:

* Front desk staff
* Finance or cashier role

User stories:

* As a front desk user, I want to sell a membership from the member profile so I can complete registration in one flow.
* As a finance user, I want pricing and dates shown clearly so I can confirm the correct sale before payment.

Key actions:

* Select member
* Select plan
* Set start date
* Review end date or session count
* Review branch eligibility
* Confirm sale details
* Create membership

Rules:

* The membership must belong to one member and one plan.
* The default MVP policy is one active operational membership per member at a time.

---

## 10. Payment Entry and Payment History Screen

Primary users:

* Finance or cashier role
* Front desk staff

User stories:

* As a finance user, I want to record a membership payment so the member's financial state is accurate.
* As a front desk user, I want to view payment status quickly so I know whether operational follow-up is needed.

Key actions:

* Add payment
* Select payment method
* Set payment status
* Store reference number
* View payment history

Rules:

* Zero or negative amounts must not be accepted as normal payments.
* Only paid payments should count as completed revenue.

---

## 11. Check-In Screen

Primary users:

* Front desk staff

User stories:

* As a front desk user, I want to check in members quickly through QR or manual search so entry is fast and consistent.
* As an operator, I want clear access decisions so invalid entries are denied with understandable reasons.

Modes:

* QR check-in
* Manual member lookup

Key actions:

* Identify member
* Validate membership state
* Validate branch eligibility
* Approve or deny access
* Record visit with access method

Rules:

* Expired, frozen, or cancelled memberships must be denied.
* Manual validation must remain available when QR is not usable.

---

## 12. Visits Screen

Primary users:

* Branch manager
* Front desk staff

User stories:

* As a branch manager, I want to review recent visits so I can monitor branch activity.
* As an operator, I want to inspect denied or suspicious entries so I can resolve access issues.

Key actions:

* View recent visits
* Filter by branch, date, and member
* View access method
* Review denied attempts when tracked

---

## 13. Notifications Screen

Primary users:

* Branch manager
* Front desk staff

User stories:

* As a branch manager, I want to review notification delivery status so I can follow up on failed reminders.
* As a front desk user, I want to trigger operational communication when memberships are close to expiration.

Key actions:

* View notification history
* Filter by member, channel, or status
* Trigger supported notifications
* Review failed delivery attempts

Rules:

* Notification failures must not silently alter payment or membership status.

---

## 14. Reports Screen

Primary users:

* Tenant owner
* Branch manager
* Finance or cashier role

User stories:

* As a branch manager, I want to see active and expired memberships so I can manage retention and access.
* As a finance user, I want a payment summary report so I can review operational revenue.

MVP reports:

* Active memberships
* Expired memberships
* Visits
* Payment summary

---

## 15. Renewal Flow

Primary users:

* Front desk staff
* Finance or cashier role

User stories:

* As a front desk user, I want to renew a member quickly so service continuity is preserved.
* As an operator, I want renewal history preserved so financial and operational records remain clear.

Entry points:

* Member profile
* Expired memberships report
* Renewal reminder list

Rules:

* The recommended MVP behavior is to create a new membership record for each renewal.
* Renewal behavior must be consistent across the application.

---

## 16. Freeze Flow

Primary users:

* Branch manager
* Authorized staff

User stories:

* As an authorized operator, I want to freeze a membership when the plan allows it so the member's status follows business policy.
* As an operator, I want freeze history retained so support and audit reviews remain clear.

Entry points:

* Member profile
* Membership details

Rules:

* A membership can be frozen only when the plan allows it.
* Expired or cancelled memberships must not be frozen.
* Freeze duration must not exceed policy limits.

---

## Cross-Screen Acceptance Notes

* Tenant boundaries must be enforced across all screens.
* Role and branch scope must affect visible actions.
* Membership and payment history must remain traceable.
* Access decisions must be consistent between the member profile, sales flow, and check-in flow.
* RTL and multilingual readiness should be considered from the start.

---

## Suggested Build Order

1. Sign in
2. Branch management
3. Staff users and roles
4. Membership plans
5. Member list and new member form
6. Member profile
7. Membership sale and activation
8. Payment entry and payment history
9. Check-in screen
10. Visits screen
11. Notifications screen
12. Reports screen
13. Renewal flow
14. Freeze flow

---

## Document Role

This file should be used to derive UI wireframes, frontend routes, acceptance criteria, and implementation tickets for the MVP web app.