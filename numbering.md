# Numbering Strategy

## Purpose

The system currently uses simple sequential numbering for members and employees, for example:

* `Mem-9999`
* `Emp-9999`

This approach may work for a single club, but it can create problems as the system grows into a multi-club SaaS platform.

## Current Situation

A real club has already been added to the system, and its members have been imported from the club's existing data file.

However, the club has **not yet started using the new system in production**.

The original source file is still available, so the currently imported data can be removed and imported again if necessary.

Therefore, this is still a safe point to change the numbering strategy without affecting live production data.

## New Numbering Strategy

Each organization/club will have a unique two-letter code.

The code will be selected **manually in agreement with the club** when the organization is created athttps://gym.sparkco.vip/platform-admin/tenants/new. so this page should be update.

Examples:

* Platinum Fitness → `PF`
* Power Gym → `PG`
* Gold Fitness → `GF`

The two-letter code must be unique across the entire system.

If the requested code is already used by another organization so https://gym.sparkco.vip/platform-admin/tenants/new will give a nice ask to select other letters, the club and system administrator will agree on another available two-letter code. 

## Member Numbers

Member numbers will include the organization's two-letter code.

Instead of:

`Mem-9999`

the member number will be:

`PF-9999`

For example:

`PF-1025`

This makes the member number identifiable as belonging to a specific organization.

## Employee Numbers

The same principle applies to employees.

Instead of:

`Emp-9999`

the employee number will be:

`PF-E-1025`

or another agreed format, provided that the organization code is clearly included.

## Important Rule

The organization code is a **business/display identifier**, not the primary database identifier.

The database should continue to use its own internal unique ID for each organization, member, employee, and user.

The two-letter organization code is used for human-readable numbers and identification.

## Why We Are Changing This Now

Using the same numbering format across all organizations can create confusion when the platform contains multiple clubs.

For example:

`Mem-125`

could refer to a member in several different clubs.

With organization-specific numbering:

`PF-125`

and

`PG-125`

are immediately distinguishable.

This will also make member cards, employee records, reports, support requests, imports, and future integrations easier to understand.

## Migration of the Current Club

Because the current club has not started production use and its original source data is still available, the existing imported member and employee numbers may be discarded.

The data can be re-imported using the new numbering strategy.

No production migration should be required.

## Final Decision

From this point forward:

1. Every new organization must have a unique two-letter code.
2. The code is selected manually in agreement with the organization.
3. The system must prevent duplicate organization codes.
4. Member and employee numbers must include the organization code.
5. Internal database IDs remain independent from these human-readable numbers.
6. The current imported club data can be re-imported using the new numbering strategy before production launch.
