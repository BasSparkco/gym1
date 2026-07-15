# Real Work Log — 2026-07-09

Plain-language summary of what actually happened today: the architecture review, what changed from the original brainstormed draft (and why), and the deployment to production.

---

## What we did today

1. **Reviewed the brainstormed draft** (`docs/Training Programs & Classes Design.md`, written after the legacy-app walkthrough with the gym owner) against the real database schema and flagged six gaps (see below).
2. **Rewrote the design doc** to a finalized, implementation-ready architecture.
3. **Updated `ROADMAP.md`** (Phase 2 status moved from "Not Started" to "Started" with the concrete module list).
4. **Built the database schema**: 5 new tables (`TrainingProgram`, `CoachProfile`, `ClassSession`, `ClassBooking`, `MembershipPlanProgram`) plus one new column (`MembershipPlan.allowAllPrograms`), as a Prisma migration.
5. **Built three backend modules**: Training Programs, Class Sessions (including recurring scheduling), and Class Bookings (booking/waitlisting/cancellation), plus a Coach Profile extension on the existing Employees module.
6. **Wrote 7 new automated tests** covering the whole flow (program creation, coach assignment, scheduling conflicts, booking, waitlisting, plan restrictions, recurring classes) — all passing.
7. **Built the member-facing screens**: pages to create/manage training programs, schedule classes (single or recurring), book/cancel members into a class, and see/set a coach's specialties on their employee profile. Fully translated (English/Arabic/Hebrew).
8. **Verified everything works** by running it locally end-to-end (created a real program, made a real employee a coach, scheduled a class, booked a real member, watched it all render correctly) before touching anything live. Found and fixed one small bug in the process (an internal field was leaking into an API response).
9. **Committed the work** to git (locally — not yet pushed anywhere).
10. **Deployed to production**, carefully: backed up the live database first, built the new app images, applied the database changes, confirmed the new tables existed, then switched the live containers over to the new version. Confirmed the live site is healthy afterward. No test data was created on the real production account — the first real training program will be a genuine one.

---

## What changed from the original draft, and why

The original draft (written by brainstorming with an AI tool before this review) had the right basic idea — separate the *commercial* side (Membership Plans) from the *activity* side (Training Programs, Classes, Coaches). That core idea didn't change. But it was a whiteboard sketch, not something that could be built directly. Here's what had to change to make it real, and why:

| # | Original draft said | What we built instead | Why |
|---|---|---|---|
| 1 | A **Coach** is a brand-new record, with its own name/phone/email fields. | A coach is an existing **Employee**, with an extra "coach profile" (specializations, certifications) attached to them. | Employees already exist in the system with names/phones/branches. A second, separate coach record would mean re-typing the same person's details twice, and the two copies would drift out of sync (e.g. a phone number updated in one place but not the other). |
| 2 | A member's Training Programs and Classes are listed directly on the member's own record. | Each booking is its own record, linking one member to one specific class at one specific time. | If a member's classes were just a list on their profile, we couldn't track *when* they booked, whether they attended, cancelled, or were on a waitlist. Proper booking history needs its own record per booking. |
| 3 | "*A Membership Plan should never determine which sport or activity a member attends.*" | A plan can optionally be restricted to specific programs (most plans still allow everything, by default). | This is unrealistic for a real gym — premium add-ons (a pool, personal training, a specialty class) are commonly gated behind a higher-tier plan. Without this, there'd be no way to stop a Basic-plan member from booking a class they haven't paid for. |
| 4 | No mention of branches/multi-location at the data level. | Every new table is tied to the gym (tenant), and a Training Program can either belong to one specific branch or be shared across all of them. | The whole system is built for multiple gyms and multiple branches per gym from day one — this had to follow the same rule as everything else already in the app, or a multi-branch gym chain couldn't use it correctly. |
| 5 | No mention of what happens if two members try to book the last seat in a class at the same time. | Booking is done as a single all-or-nothing database operation that locks the class while it counts seats, so it's physically impossible for two people to grab the same last seat. | Without this, a class with 1 seat left could accidentally accept 2 people if they tapped "book" at the same moment — a real bug that would show up under real usage, not testing. |
| 6 | "Recurring schedules" was listed only as a *future* idea, with no detail on how it would work. | Built now — you can schedule a class to repeat weekly for a set number of weeks, and edit/cancel the whole series or just one class in it. | Nearly every gym class (a Tuesday Yoga class, say) repeats every week — building this as an afterthought later would have meant reworking the class table from scratch. Doing it correctly now (one shared "series ID" tagging weekly copies) means no rework later. |
| 7 | Attendance was described as a *separate future feature*, tracked via RFID/QR/Face recognition, disconnected from anything else. | Attendance is automatically detected using the gate check-in system that already exists — no new hardware or scanning step needed. | The gym already has a working check-in system (RFID/QR/manual) for general gym access. Building a second, separate attendance system for classes specifically would mean two systems doing almost the same job, and staff having to use both. |
| 8 | No mention of a coach or a room being double-booked. | Creating a class now checks that the same coach or the same room isn't already booked for an overlapping time. | Without this, the schedule could accidentally book "Coach Sami" to teach two different classes in two different rooms at 6pm — a scheduling mistake that's easy to make by hand and easy to prevent in software. |
| 9 | No mention of what happens if a member's membership has expired or is frozen. | Booking a class checks that the member has an active (not frozen/expired) membership at the moment of booking, and again when a waitlisted member is being promoted into a freed-up seat. | A member whose membership lapsed shouldn't be able to keep booking classes — and if they were sitting on a waitlist when their membership lapsed, they shouldn't get silently promoted into a seat once one opens up. |

**Net effect**: the original idea (separate commercial plans from training activities) was correct and stayed the same. Everything in the table above is about turning a good idea into something that survives real usage — real gyms with multiple branches, real members double-booking by accident, real coaches getting scheduled twice, and real memberships expiring mid-booking.
