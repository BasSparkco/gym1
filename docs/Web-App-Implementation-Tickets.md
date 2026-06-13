# Spark Gym ERP Web App Implementation Tickets

Version: 1.0

This document breaks the MVP route map into implementation tickets.
Each ticket includes frontend scope, backend scope, and acceptance criteria so the team can plan delivery without reopening product scope.

---

## How To Use This Document

* Each ticket is organized around one route or a tight route pair.
* Frontend scope describes screens, state, navigation, and validation responsibilities.
* Backend scope describes APIs, authorization, persistence, and business-rule enforcement.
* Acceptance criteria define the minimum outcome for completion.

This document should stay aligned with [Web-App-Route-Map.md](Web-App-Route-Map.md), [Web-App-User-Stories.md](Web-App-User-Stories.md), [MVP-Requirements.md](MVP-Requirements.md), and [Business-Rules.md](Business-Rules.md).

---

## Delivery Order

Recommended implementation order:

1. Authentication and app shell
2. Branch setup
3. Users and roles
4. Settings (language)
5. Membership plans
6. Members
7. Member details
8. Membership sale
9. Payments
10. Check-in
11. Visits
12. Notifications
13. Reports
14. Renewals
15. Freezes

Settings is placed early because the language selection and RTL direction affect all screens that follow.

---

## Ticket T01: Sign In

Routes:

* `/signin`

Frontend scope:

* Build the sign-in page.
* Add email or username and password inputs.
* Add submit loading, error, and success states.
* Redirect authenticated users into the app shell.

Backend scope:

* Implement authentication endpoint.
* Validate credentials.
* Return authenticated user identity, tenant, and role context.
* Prevent cross-tenant access.

Acceptance criteria:

* Valid users can sign in successfully.
* Invalid credentials show a clear error.
* Authenticated users are redirected away from `/signin`.
* Returned user context is sufficient to drive role-aware navigation.

---

## Ticket T02: App Shell and Dashboard

Routes:

* `/app`
* `/app/dashboard`

Frontend scope:

* Build the authenticated layout with left navigation, top bar, and page content area.
* Show role-aware navigation items.
* Build dashboard cards for active memberships, expired memberships, recent visits, and payment summary.
* Show operational shortcuts where appropriate.

Backend scope:

* Implement current-user session endpoint if needed.
* Implement dashboard summary endpoints.
* Enforce tenant and role filtering on dashboard data.

Acceptance criteria:

* Authenticated users can access the app shell.
* Users only see navigation items allowed by their role.
* Dashboard data is filtered to the correct tenant.
* Dashboard loads enough data to support daily operational use.

---

## Ticket T03: Branch List and Create Branch

Routes:

* `/app/branches`
* `/app/branches/new`

Frontend scope:

* Build the branch listing screen.
* Add create-branch form with validation.
* Support branch status display and navigation to branch details.

Backend scope:

* Implement list branches endpoint.
* Implement create branch endpoint.
* Enforce tenant ownership.
* Persist branch contact and operational details.

Acceptance criteria:

* Authorized users can list branches for their tenant.
* Authorized users can create a branch with valid data.
* Branches created under one tenant are invisible to other tenants.

---

## Ticket T04: Branch Details and Edit Branch

Routes:

* `/app/branches/:branchId`
* `/app/branches/:branchId/edit`

Frontend scope:

* Build branch details screen.
* Build edit form with prefilled values.
* Show branch state and configuration fields.

Backend scope:

* Implement get branch details endpoint.
* Implement update branch endpoint.
* Enforce tenant ownership and role checks.

Acceptance criteria:

* Authorized users can view branch details.
* Authorized users can edit branch details.
* Unauthorized or cross-tenant branch access is blocked.

---

## Ticket T05: User List, Create User, and User Details

Routes:

* `/app/users`
* `/app/users/new`
* `/app/users/:userId`
* `/app/users/:userId/edit`

Frontend scope:

* Build user list and filterable table.
* Build create-user form.
* Build user details and edit screens.
* Show role assignment and branch scope controls.

Backend scope:

* Implement list users, create user, get user, and update user endpoints.
* Persist user role assignments and branch scope assignments.
* Enforce tenant isolation and owner-only capabilities where required.

Acceptance criteria:

* Authorized users can create and update staff users.
* Users belong to the correct tenant.
* Branch-scoped access can be assigned and retrieved.
* Unauthorized users cannot access user administration routes.

---

## Ticket T06: Roles Management

Routes:

* `/app/roles`

Frontend scope:

* Build roles screen.
* Show role definitions and permissions summary.
* Support assigning permissions or viewing preset roles depending on implementation approach.

Backend scope:

* Implement roles and permissions read endpoints.
* Implement role update endpoints if roles are editable in MVP.
* Enforce tenant-aware role access where required.

Acceptance criteria:

* Authorized users can view roles.
* Role data is usable by the user-management flow.
* Permission mapping supports route-level authorization decisions.

---

## Ticket T07: Membership Plans List and Create Plan

Routes:

* `/app/membership-plans`
* `/app/membership-plans/new`

Frontend scope:

* Build membership plan list.
* Build create-plan form with plan type, price, duration, session count, branch rules, and freeze settings.
* Add validation for invalid combinations.

Backend scope:

* Implement list plans and create plan endpoints.
* Persist plan type, duration, session count, branch eligibility, and freeze rules.
* Enforce tenant ownership.

Acceptance criteria:

* Authorized users can create a valid membership plan.
* Invalid plan configurations are rejected.
* Plans are only visible inside the owning tenant.

---

## Ticket T08: Membership Plan Details and Edit Plan

Routes:

* `/app/membership-plans/:planId`
* `/app/membership-plans/:planId/edit`

Frontend scope:

* Build plan details screen.
* Build edit form with validation and plan-policy fields.
* Show plan rules clearly for operational use.

Backend scope:

* Implement get plan and update plan endpoints.
* Protect historical integrity so plan changes do not silently rewrite past memberships.

Acceptance criteria:

* Authorized users can view and update plan details.
* Historical memberships remain intact after plan edits.
* Cross-tenant access to plan records is blocked.

---

## Ticket T09: Members List and Create Member

Routes:

* `/app/members`
* `/app/members/new`

Frontend scope:

* Build searchable member list.
* Add filters for branch and status.
* Build create-member form with required fields and validation.

Backend scope:

* Implement list members and create member endpoints.
* Enforce unique member number within tenant.
* Persist home branch, emergency contact, and medical notes.

Acceptance criteria:

* Authorized users can list members in their allowed scope.
* Authorized users can create a member with valid required fields.
* Duplicate member numbers within the same tenant are rejected.

---

## Ticket T10: Member Profile and Edit Member

Routes:

* `/app/members/:memberId`
* `/app/members/:memberId/edit`

Frontend scope:

* Build member profile layout with overview, memberships, payments, visits, and notifications sections.
* Build edit-member form.
* Surface actions for sell membership, record payment, renew, and freeze.

Backend scope:

* Implement member details endpoint with related operational summaries.
* Implement update member endpoint.
* Enforce branch and tenant visibility rules.

Acceptance criteria:

* Authorized users can view full operational member context.
* Authorized users can update member details.
* Related history remains accessible from the member profile.

---

## Ticket T11: Membership Sale and Activation

Routes:

* `/app/members/:memberId/memberships/new`

Frontend scope:

* Build membership sale screen from the member context.
* Allow plan selection, date selection, price review, and branch-eligibility review.
* Show validation messages for conflicting active memberships or invalid plan choices.

Backend scope:

* Implement create membership endpoint.
* Enforce member-to-plan relationship rules.
* Enforce default MVP policy of one active operational membership at a time unless policy changes later.
* Persist membership status, start date, end date, and pricing fields.

Acceptance criteria:

* Authorized users can create a valid membership for a member.
* Invalid activations are rejected with clear reasons.
* Membership state is stored correctly for later check-in and reporting use.

---

## Ticket T12: Payment Entry and Payment History

Routes:

* `/app/members/:memberId/payments/new`

Frontend scope:

* Build payment entry form from the member context.
* Show related membership context when recording payment.
* Show payment history in the member profile or related payment panel.

Backend scope:

* Implement create payment endpoint.
* Implement member payment history endpoint if not covered by member details.
* Enforce payment validation for amount, status, method, and reference.
* Link payment to member and related membership.

Acceptance criteria:

* Authorized users can record a payment for a member.
* Zero or negative normal payments are rejected.
* Paid, pending, failed, refunded, and cancelled states can be represented consistently.
* Payment history is visible and traceable.

---

## Ticket T13: Check-In Screen

Routes:

* `/app/check-in`

Frontend scope:

* Build high-speed check-in screen.
* Support QR input and manual member lookup.
* Show member summary, membership state, and access decision.
* Record access method used.

Backend scope:

* Implement access-validation endpoint or service.
* Implement visit creation endpoint.
* Enforce membership status, branch eligibility, freeze, expiry, and payment-policy rules.

Acceptance criteria:

* Staff can identify a member through QR or manual search.
* Valid members are checked in successfully.
* Invalid access attempts are denied with a clear reason.
* Visit records store branch, time, member, and access method.

---

## Ticket T14: Visits List and Visit Details

Routes:

* `/app/visits`
* `/app/visits/:visitId`

Frontend scope:

* Build visits list with date, branch, member, and access-method filters.
* Build visit details view if needed.
* Show recent activity and flagged entries when available.

Backend scope:

* Implement visits listing endpoint.
* Implement visit details endpoint.
* Enforce branch-scoped visibility where required.

Acceptance criteria:

* Authorized users can browse visits for their allowed scope.
* Visit filtering works by date, branch, and member.
* Visit data remains auditable and historically traceable.

---

## Ticket T15: Notifications List and Details

Routes:

* `/app/notifications`
* `/app/notifications/:notificationId`

Frontend scope:

* Build notification history screen.
* Add filters for member, channel, and delivery status.
* Build notification details view when needed.

Backend scope:

* Implement notifications list endpoint.
* Implement notification details endpoint.
* Return notification delivery status and related member context.

Acceptance criteria:

* Authorized users can review notification history.
* Delivery status is visible for operational follow-up.
* Notification data respects tenant boundaries.

---

## Ticket T16: Reports Home and Report Endpoints

Routes:

* `/app/reports`
* `/app/reports/active-memberships`
* `/app/reports/expired-memberships`
* `/app/reports/visits`
* `/app/reports/payments`

Frontend scope:

* Build reports landing page.
* Build individual report views or tabs for active memberships, expired memberships, visits, and payments.
* Add branch and date filtering where applicable.

Backend scope:

* Implement report endpoints for active memberships, expired memberships, visits, and payments.
* Enforce tenant and branch filtering.
* Return data suitable for operational review and export later.

Acceptance criteria:

* Authorized users can open all MVP reports.
* Reports are filtered to the correct tenant and branch scope.
* Report totals and row-level data match underlying operational records.

---

## Ticket T17: Renew Membership

Routes:

* `/app/members/:memberId/renew`

Frontend scope:

* Build renewal flow from the member context.
* Show current and previous membership context.
* Allow plan selection, new period review, and transition into payment recording.

Backend scope:

* Implement renewal service or endpoint.
* Create a new membership record according to the recommended MVP policy.
* Preserve historical traceability to prior memberships where possible.

Acceptance criteria:

* Authorized users can renew a membership consistently.
* Renewal does not overwrite historical membership records.
* The new membership is visible immediately in the member profile and relevant reports.

---

## Ticket T18: Freeze Membership

Routes:

* `/app/members/:memberId/freeze`

Frontend scope:

* Build freeze form from the member context.
* Show freeze eligibility, existing freeze history, and plan restrictions.
* Validate requested freeze dates before submission.

Backend scope:

* Implement create freeze endpoint.
* Enforce plan freeze policy, status checks, and freeze date rules.
* Update membership operational state for the freeze period.

Acceptance criteria:

* Authorized users can freeze eligible memberships.
* Ineligible memberships cannot be frozen.
* Freeze history remains visible and auditable.
* Frozen memberships are treated as invalid for access during the freeze period.

---

## Ticket T19: Settings – Language Configuration

Routes:

* `/app/settings`
* `/app/settings/language`

Frontend scope:

* Build the settings shell with a left-side section list (Language is the first section).
* On the language settings screen, show:
  * A default language selector — a single dropdown for English, Arabic, and Hebrew.
  * A language visibility list — three toggle rows (one per language) showing which languages appear in the app-wide language picker.
  * Each row shows the language name in its own script (English, العربية, עברית) so the admin can identify them regardless of the current UI language.
  * Prevent disabling a language that is currently set as the default.
  * Prevent disabling all three languages (at least one must remain enabled).
* Apply the selected default language and RTL/LTR direction to the full app shell immediately on save without a full page reload.
* The settings page itself must render correctly in the active language and direction.

Backend scope:

* Add a tenant-level settings record (or extend the existing tenant record) to persist:
  * `default_language`: one of `en`, `ar`, `he`
  * `enabled_languages`: array of enabled language codes
* Implement GET `/api/settings` and PATCH `/api/settings` endpoints, tenant-scoped.
* Validate that `default_language` is always present in `enabled_languages`.
* Validate that at least one language is enabled.
* Return tenant settings as part of the authenticated session response so the frontend can apply the correct language on first load.

Acceptance criteria:

* Tenant owner can change the default language; the app relaunches in the selected language and direction.
* Disabling a language removes it from the app-wide language picker.
* A language that is the current default cannot be disabled until a different default is chosen.
* Arabic and Hebrew render the full app shell in RTL layout.
* English renders the app shell in LTR layout.
* Tenant A language settings do not affect Tenant B.

---

## Cross-Cutting Ticket Notes

These items apply to all route tickets:

* Tenant isolation must be enforced everywhere.
* Role checks must be enforced at both route and data layers.
* Branch-scoped permissions must affect members, visits, payments, and check-in.
* Audit-sensitive actions should leave a traceable record.
* Validation errors should be explicit enough for front-desk use.
* Multilingual and RTL readiness should be considered in layout and content structure.

---

## Suggested Engineering Split

For sprint planning, each ticket can be split internally into:

* UI and route work
* Form validation and client state
* API contract and backend handler
* Authorization and business-rule enforcement
* Acceptance test coverage

---

## Document Role

This file should be used to create engineering backlog items for the MVP web app.
If route scope changes, the ticket plan should be updated here before implementation planning continues.