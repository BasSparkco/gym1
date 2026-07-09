# Training Programs & Classes Design

## Purpose

This document defines the architecture for managing Training Programs, Classes, and Coaches within Spark Gym.

The objective is to separate commercial membership information from the actual training activities offered by the gym, while explicitly connecting the two where the business requires it (entitlements, capacity, entitled bookings).

This is the finalized version of the original brainstormed draft, revised after architectural review against the live Prisma schema (`apps/api/prisma/schema.prisma`). Status: **approved, implementation in progress** — see [ROADMAP.md](../ROADMAP.md) Phase 2.

---

## Design Principles

Four core entities, kept independent but explicitly linked where the business needs it:

| Entity            | Purpose                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| Membership Plan   | Commercial: pricing, billing, duration, access rules. *(already exists)* |
| Training Program  | The activity/discipline (CrossFit, Yoga, Swimming, ...).                 |
| Class Session      | One scheduled occurrence of a Training Program.                          |
| Coach             | An `Employee` extended with coaching-specific data — not a new person record. |

Every model below is tenant-scoped (`tenantId`) following the convention used by every existing model in the schema. "Global" Training Programs are modeled as `branchId = null`; branch-specific ones set it.

---

## 1. Membership Plan (unchanged)

`MembershipPlan` already models the commercial tier (Monthly, VIP, Student, ...) via `planType`, `durationDays`/`sessionCount`, `price`, `freezeAllowed`. **This document does not change that model.**

The one addition: an **entitlement link** to Training Programs, because a real gym restricts some plans from premium activities (pool, personal training). This mirrors the existing `allowAllBranches` pattern:

* `MembershipPlan.allowAllPrograms: Boolean @default(true)`
* `MembershipPlanProgram` join table lists the *exceptions* when `allowAllPrograms = false` (i.e., which programs that plan *is* allowed to book).

This was the biggest gap in the original draft — it explicitly said a plan should never determine which activity a member can attend, which doesn't hold once premium/add-on classes exist.

---

## 2. Training Program

Represents the activity (CrossFit, Yoga, Swimming, Kids Fitness, ...). No pricing information — pricing lives on `MembershipPlan` (base access) or is enforced via the entitlement link above (premium gating).

Attributes: `name`, `description`, `branchId` (nullable = global), `color`, `icon`, `active`, `maxMembers` (optional default capacity for its sessions), `defaultCoachId` (→ `Employee`, optional).

---

## 3. Coach

**Not a new person entity.** A coach is an `Employee` (already has `fullName`, `phone`, `branchId`, `status`) extended with a 1:1 `CoachProfile` — same pattern as `TenantSettings` extending `Tenant`:

* `CoachProfile.employeeId` (PK/FK → `Employee.id`)
* `specializations: String[]`
* `certifications: String[]`

Rationale: creating a parallel `Coach` table with its own Full Name/Phone/Email would duplicate person data already in `Employee` and desync (a coach who is also front-desk staff, phone updated in one place only). An employee becomes a coach by gaining a `CoachProfile` row, not by a new record.

---

## 4. Class Session (template + instance split)

The original draft treated every scheduled session as an independent row with a literal date — fine for one-off classes, unworkable for recurring schedules (can't bulk-edit "all future Monday CrossFit," can't model a single cancelled occurrence without deleting/recreating).

Model:

* `ClassSession` — one concrete, bookable occurrence: `programId`, `branchId`, `coachId` (optional), `room`, `date`, `startTime`, `endTime`, `capacity`, `status` (`scheduled` / `cancelled` / `completed`), `recurrenceId` (nullable — groups sessions generated from the same recurring rule so a bulk edit/cancel can target the group without a separate rule-engine table for MVP).

Recurring generation is a service-level batch operation (e.g., "create this session weekly for the next 8 weeks") that writes concrete `ClassSession` rows sharing a `recurrenceId` — no separate `rrule` interpreter needed at this stage. Cancelling or editing a single occurrence only touches its row; editing "the series" updates all rows sharing the `recurrenceId` with `date >= today`.

---

## 5. Class Booking

Bookings are **not** fields on `Member`. A `ClassBooking` join row per member per session:

* `classSessionId`, `memberId`, `membershipId` (the membership used to validate entitlement at booking time), `status` (`booked` / `waitlisted` / `attended` / `no_show` / `cancelled`), `bookedAt`, `visitId` (nullable — set once the member's actual gate check-in is matched to this booking).

`@@unique([classSessionId, memberId])` prevents double-booking the same session.

### Booking validation (enforced in the service, inside a transaction)

1. Membership must be `active` (not `frozen`/`expired`/`cancelled`) at booking time — reuses `Membership.status`.
2. Plan entitlement: if `plan.allowAllPrograms` is false, `MembershipPlanProgram` must include the session's program.
3. No overlapping booking for the same member (another `ClassSession` they're already booked into with an overlapping time window).
4. Capacity: count existing non-cancelled bookings for the session under a row lock (`SELECT ... FOR UPDATE` via `$transaction`) before inserting — if at capacity, insert as `waitlisted` instead of `booked`, atomically, to avoid the classic two-simultaneous-bookings-for-the-last-seat race.
5. Coach/room double-booking is a *creation-time* check on `ClassSession` itself (can't create two sessions for the same coach/room with overlapping times), not a booking-time check.

### Attendance

Attendance reuses the existing `Visit` model rather than building a second tracking pipeline. When a member checks in via gate/QR/RFID within a session's time window at its branch, the visit is matched to their `ClassBooking` (if one exists for that session) and the booking's `visitId`/`status` (`attended`) is set. A booking that remains `booked` past the session's end time with no matching visit becomes `no_show` (swept by the same kind of scheduled job pattern already used for `NotificationsSchedulerService`).

### Waiting list promotion

When a `booked` row is cancelled, the oldest `waitlisted` row for that session is promoted to `booked` in the same transaction (still subject to the entitlement/membership-status checks re-validated at promotion time, since a plan could have expired since the member joined the waitlist).

---

## Recommended Relationships

```
MembershipPlan --(allowAllPrograms / MembershipPlanProgram)--> TrainingProgram
Member --(Membership: active/frozen/expired)--> books --> ClassBooking --> ClassSession --> TrainingProgram
ClassSession --> Employee (via CoachProfile) for the coach
ClassBooking --(visitId)--> Visit  (attendance)
```

A member's Membership Plan does not gate every activity — only the ones marked premium via `MembershipPlanProgram`. Everything else follows the original chain: Member → Training Program → Class → Coach.

---

## Edge Cases Addressed (gaps in the original draft)

* **Membership transitions**: frozen/expired/cancelled memberships block new bookings; a freeze that starts mid-way through an already-booked class does not auto-cancel the booking (front-desk judgment call), but blocks *new* bookings for the frozen period.
* **Scheduling conflicts**: member double-booking, coach double-booking, room double-booking — all explicitly checked (see above).
* **Capacity race conditions**: enforced via transaction + row lock, not application-level count-then-insert.
* **Waiting list promotion**: explicit, atomic, re-validates entitlement/membership status at promotion time (not just at original waitlist join time).
* **Attendance vs. gate visits**: unified through `Visit`, not a second parallel system.
* **Recurring schedule edits/exceptions**: `recurrenceId` groups instances for bulk edit; a single occurrence can be cancelled independently.
* **Tenant/branch scoping**: every model tenant-scoped; Training Programs can be tenant-global (`branchId = null`) or branch-specific, consistent with the rest of the schema.
* **Guest/drop-in passes**: out of scope for this phase — flagged as a Phase-2-follow-up if the client asks for it; `ClassBooking.membershipId` currently assumes a member always has one.

---

## Future Scalability (unchanged from original draft, still valid)

Class Booking, Waiting Lists, Coach Performance Reports, Program Statistics, Member Progress, Multi-Branch Support — all remain valid future directions; this document's schema is designed to support them without structural rework.

Note: **"Training Programs" also appears in [ROADMAP.md](../ROADMAP.md) Phase 6 ("Fitness Features")** — that entry refers to workout plans / exercise libraries / progress tracking (personal-training content), a distinct concept from the scheduling entity defined here. Do not conflate the two when reading the roadmap.

---

## Conclusion

Four core entities — Membership Plan, Training Program, Class Session, Coach (via `CoachProfile` on `Employee`) — plus two join concerns (`MembershipPlanProgram` for entitlement, `ClassBooking` for enrollment/attendance) give a normalized, tenant-scoped, race-safe foundation for scheduling, attendance, and reporting, while reusing existing infrastructure (`Employee`, `Membership`, `Visit`) instead of duplicating it.
