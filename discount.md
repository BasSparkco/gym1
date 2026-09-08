# Discount Management

## 0. Current State / Scope Note (read first)

This is a **behavior change**, not a purely additive feature. Today, `finalPrice`
on a membership is a free-text field, pre-filled with the plan price, that
staff can already overwrite to anything they want — both at creation
(`membership-form-fields.tsx`) and at renewal (`renew-form-fields.tsx`). The
backend accepts whatever the client sends
(`finalPrice: input.finalPrice ?? plan.price` in `memberships.service.ts`).

This feature removes that freeform entry and replaces it with
`Discount Type + Discount %`. That needs sign-off from whoever relies on
being able to type an arbitrary price today (e.g. a one-off correction that
isn't really a "discount"). The assumption below is that the `Other`
discount type is the escape hatch for those cases; there is no remaining way
to charge a price staff simply chooses on the spot, and no way to charge
*above* plan price (a surcharge) — that's a separate, out-of-scope feature
if it turns out to be needed.

**v1 scope is Membership only.** `Locker` and `TrainingProgram` enrollments
have the exact same staff-editable `finalPrice` pattern today
(`locker-form-fields.tsx`), but are intentionally left untouched in this
iteration — see §25.

## 1. Objective

Add a controlled discount mechanism to the Gym SaaS membership flow.

The goal is to support cases such as:

- Student pricing
- Employee pricing
- Family pricing
- Special offers
- Renewal discounts
- Administrative discounts
- Other custom discounts

The system must **not allow staff to directly edit the final membership price**.

The final price must always be calculated from the plan's regular price and the applied discount.

Core rule:

```text
Final Price = Regular Price - Discount Amount
Discount Amount = Regular Price × Discount Percentage / 100
```

Example:

```text
Regular Price: 400 ₪
Discount Type: Student
Discount: 37.5%
Final Price: 250 ₪
```

---

# 2. Important Design Principles

## 2.1 Final Price Is Calculated

The user must never be able to manually enter or override the final price.

Do not provide an editable `Final Price` input.

The UI should display it as a calculated/read-only value.

## 2.2 Discount Is Explicit

A price reduction must be represented as a discount percentage.

Do not support a hidden/manual price override as part of this feature.

For example, do NOT allow:

```text
Plan: Monthly
Price: 400
Final Price: 250
```

without a recorded discount.

Instead:

```text
Plan: Monthly
Regular Price: 400
Discount Type: Student
Discount: 37.5%
Final Price: 250
```

## 2.3 Discount Type Is Configurable

Discount types are tenant-specific master data.

Each tenant can create its own discount types.

Do not hard-code the list of discount types in application logic.

## 2.4 Historical Data Must Not Change

When a membership is created, store the actual discount values used at that time.

If the owner later changes the Student discount configuration, existing memberships must remain unchanged.

Example:

```text
Membership A
Regular Price: 400
Discount Type: Student
Discount: 37.5%
Final Price: 250
```

Later the owner changes the Student configuration to 25%.

Membership A must still have:

```text
Discount: 37.5%
Final Price: 250
```

---

# 3. Database

Create a new table:

## `DiscountType`

Recommended fields (naming follows this project's Prisma conventions —
camelCase columns, `String @id` cuid-style keys, `Tenant`/`tenantId` for
tenant scoping, not `gym`/`gym_id`):

```text
id            String   @id
tenantId      String
name          String
description   String?
isActive      Boolean  @default(true)
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
```

### Field details

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key, matches existing models |
| `tenantId` | `String`, FK to `Tenant` | Required; tenant isolation |
| `name` | `String` | Required |
| `description` | `String?` | Optional |
| `isActive` | `Boolean` | Default `true` |
| `createdAt` | `DateTime` | Required |
| `updatedAt` | `DateTime` | Required |

Use the project's existing ID, timestamp, naming and migration conventions
(mirror `Locker` or `TrainingProgram` in `schema.prisma`).

## Tenant isolation

Every query involving `DiscountType` must be scoped by `tenantId`.

A user from Tenant A must never be able to read, modify, or use a discount type belonging to Tenant B.

---

# 4. Default Discount Types

When a new tenant is created, seed these default types:

1. Student
2. Employee
3. Family
4. Special Offer
5. Renewal
6. Administrative
7. Other

These are defaults only.

The tenant owner must be able to:

- Add custom types
- Rename types
- Deactivate types
- Reactivate types

Do not permanently hard-code these seven values as an enum.

---

# 5. Deactivation Instead of Deletion

Discount types should normally be deactivated rather than physically deleted.

Reason:

Existing memberships may reference a discount type.

Example:

```text
Student
isActive = false
```

The type should no longer appear as an option for new memberships, but historical memberships using Student must continue to display correctly.

If the existing project has a standard soft-delete/archive pattern, follow that pattern where appropriate.

---

# 6. Settings Page

Add a new settings section:

```text
Settings
  └── Discount Types
```

The page should display the tenant's discount types.

Example:

```text
Discount Types

+ Add Discount Type

-----------------------------------------
Name              Status       Actions
-----------------------------------------
Student           Active       Edit
Employee          Active       Edit
Family            Active       Edit
Special Offer     Active       Edit
Renewal           Active       Edit
Administrative    Active       Edit
Other             Active       Edit
```

## Actions

### Add

Owner/authorized user can create a new discount type.

Required:

```text
Name
```

Optional:

```text
Description
```

New records should default to:

```text
isActive = true
```

### Edit

Allow changing:

- Name
- Description
- Active status, if supported by the UI

### Deactivate

Do not delete historical records.

Deactivate the type.

### Reactivate

Allow a previously inactive type to become active again.

---

# 7. API / Backend

Follow the existing project's controller/service/repository/module conventions.

Implement CRUD functionality for discount types.

Suggested API concept:

```text
GET    /discount-types
POST   /discount-types
PATCH  /discount-types/:id
DELETE /discount-types/:id
```

However, if the existing backend uses a different REST convention, follow the existing project convention instead of introducing a new style.

## GET

Return only discount types belonging to the current tenant.

For normal membership creation, return active types.

If the Settings page needs inactive types, provide the appropriate query/filter or admin endpoint.

## POST

Create a discount type for the current tenant.

Validate:

- Name is required
- Name is not empty
- Tenant comes from authenticated context
- Do not trust a client-supplied `tenantId`

## PATCH

Allow authorized users to modify a discount type belonging to their tenant.

## DELETE

Prefer deactivation/archive behavior.

Do not physically delete a type that is referenced by historical memberships.

---

# 8. Membership Database Changes

Modify `Membership` (`schema.prisma`), which today only stores `finalPrice`
(no `regularPrice` snapshot — that's implicitly `plan.price` at the time,
which is exactly the gap this feature closes).

Add fields:

```text
discountTypeId   String?   // FK to DiscountType, nullable = "None"
discountPercent  Decimal   @db.Decimal(5, 2) @default(0)
regularPrice     Decimal   @db.Decimal(10, 2)
finalPrice       Decimal   @db.Decimal(10, 2)  // already exists
```

`discountPercent` needs explicit decimal precision (`Decimal(5,2)`, not a
bare "number") to support values like `37.5` and match the project's
Decimal-everywhere money convention (see §10).

## Important: Store a Snapshot

At the moment the membership is created, store:

```text
regularPrice
discountTypeId
discountPercent
finalPrice
```

The critical requirement is that the membership retains the actual values applied at sale time.

## Renewal Uses the Same Fields

`renew-form-fields.tsx` currently has its own freeform `finalPrice` input,
separate from the new-membership form. It must get the same
`Discount Type + Discount %` treatment and write the same snapshot fields —
otherwise renewal remains the one place staff can still set an arbitrary
price, defeating the point of this feature.

---

# 9. Price Calculation

The backend must be the source of truth for the final price.

Do not trust a client-calculated `finalPrice`.

Given:

```text
regularPrice
discountPercent
```

calculate:

```text
discountAmount = regularPrice × discountPercent / 100

finalPrice = regularPrice - discountAmount
```

Example:

```text
regularPrice = 400
discountPercent = 37.5

discountAmount = 150
finalPrice = 250
```

## Validation

Reject invalid discount percentages.

Minimum:

```text
0%
```

Maximum:

```text
100%
```

Reject:

```text
-1%
101%
```

Also prevent invalid numeric values such as NaN/infinite values if applicable to the stack.

---

# 10. Money Handling

Follow the existing project's money/decimal strategy.

Do not introduce floating-point calculations if the project already has a Decimal/money approach.

The final stored value must be financially accurate.

If the project uses database `Decimal`, continue using it.

Do not silently convert monetary values to JavaScript floating-point numbers for persistent calculations.

---

# 11. Membership Creation UI

Current flow:

```text
Membership Plan
Price
Final Price
```

Change to:

```text
Membership Plan
Monthly

Regular Price
400 ₪

Discount Type
[ None ▼ ]

Discount
[ 0 ] %

Final Price
400 ₪
```

When selecting Student:

```text
Membership Plan
Monthly

Regular Price
400 ₪

Discount Type
[ Student ▼ ]

Discount
[ 37.5 ] %

Final Price
250 ₪
```

The final price is read-only.

---

# 12. Discount Type Selection

The membership screen should load active discount types for the current tenant.

The first/default option should be:

```text
None
```

If `None` is selected:

```text
Discount = 0%
Final Price = Regular Price
```

If a discount type is selected:

```text
Discount Type = selected type
Discount = entered percentage
```

---

# 13. Where the Discount Percentage Comes From

For the first implementation, the discount percentage is entered during membership creation.

Example:

```text
Discount Type: Student
Discount: 37.5%
```

Do NOT implement a complex automatic discount-rule engine in this version.

The `DiscountType` table represents the **reason/category of the discount**, not a permanent pricing rule.

This keeps the first implementation simple and flexible.

---

# 14. Permissions

The system must not allow every staff member to give unlimited discounts.

Use the existing role system (`UserRole`: `owner`, `manager`, `frontDesk` —
there's no separate granular permissions framework beyond these three
roles today).

At minimum, enforce authorization for:

- Creating discount types
- Editing discount types
- Deactivating discount types
- Applying discounts, according to the project's current role model

**Proposed default (confirm before implementing):**

- Managing discount types (create/edit/deactivate/reactivate): `owner`, `manager`.
- Applying a discount during membership creation/renewal: any role that can
  already create/renew a membership (currently all three), capped at some
  percentage for `frontDesk`.
- A 100% discount specifically: `owner`/`manager` only — `frontDesk` should
  not be able to zero out a membership price unsupervised.

If the project already has a permissions framework, integrate with it instead of creating a separate authorization mechanism.

## Important

The backend must enforce permissions.

Do not rely only on hiding UI controls.

---

# 15. Discount Auditability

Every membership created with a discount should clearly retain:

```text
Regular Price
Discount Type
Discount Percentage
Final Price
```

This allows the owner to understand why two members on the same plan may have different prices.

Example:

```text
Member A
Monthly
Regular: 400 ₪
Discount: 0%
Final: 400 ₪

Member B
Monthly
Discount Type: Student
Regular: 400 ₪
Discount: 37.5%
Final: 250 ₪
```

---

# 16. Future Reporting

Do not build the complete reporting UI as part of this task unless it already fits naturally into the current project.

However, the database must support future reports such as:

```text
Total regular value
Total discount amount
Actual revenue

Discounts by type
Discounts by employee
Discounts by date
```

Therefore, do not store only `finalPrice`.

The system must retain the discount information.

---

# 17. Migration / Existing Memberships

This is important because the system already contains data.

Existing memberships created before this feature must remain valid.

Migration strategy:

```text
discountTypeId = NULL
discountPercent = 0
```

for existing memberships, where appropriate.

Existing prices must not change.

For example:

```text
Existing membership:
Price = 400
```

After migration:

```text
Regular Price = 400
Discount = 0%
Final Price = 400
```

Do not recalculate historical membership prices from current plan configuration.

Follow the existing project's migration conventions.

---

# 18. Data Import / Current Tenant Migration

The current tenant is being migrated from another system.

During import, if the old system has information indicating that a member has a discounted price, map it into:

```text
regularPrice
discountTypeId
discountPercent
finalPrice
```

If the old system only provides a final price and there is no reliable discount reason, do not invent a reason.

Use the project's agreed migration behavior for legacy data.

If a historical discounted price must be preserved but its reason is unknown, the safest representation is:

```text
Discount Type: Other
```

with an appropriate note/description if the migration process supports it.

Do not change the member's actual historical price just to fit the new model.

---

# 19. Important Security Rules

The backend must enforce all of the following:

### Rule 1
A client cannot submit an arbitrary `finalPrice` and have the backend accept it.

### Rule 2
The backend calculates final price from the regular price and discount percentage.

### Rule 3
`discountTypeId` must belong to the authenticated user's tenant.

### Rule 4
Inactive discount types should not be selectable for new memberships.

### Rule 5
A staff user cannot bypass the discount permission/limit by manipulating the API request.

### Rule 6
Historical membership values must remain unchanged when discount types are edited or deactivated.

### Rule 7
Do not trust `tenantId` supplied by the client.

Always derive tenant context from the authenticated session/token.

---

# 20. Validation Examples

### Valid

```text
Regular Price: 400
Discount: 0%
Final: 400
```

```text
Regular Price: 400
Discount: 25%
Final: 300
```

```text
Regular Price: 400
Discount: 37.5%
Final: 250
```

```text
Regular Price: 400
Discount: 100%
Final: 0
```

### Invalid

```text
Discount: -5%
```

```text
Discount: 105%
```

```text
Regular Price: 400
Client Final Price: 0
Discount: 0%
```

The last example must result in:

```text
Final Price: 400
```

not 0.

---

# 21. Tests

Implement tests according to the project's existing testing setup.

At minimum cover:

## Discount Type

- Create discount type
- Update discount type
- Deactivate discount type
- Reactivate discount type
- Tenant isolation
- Unauthorized access

## Membership Pricing

Test:

```text
400 + 0% = 400
400 + 10% = 360
400 + 25% = 300
400 + 37.5% = 250
400 + 100% = 0
```

Also test invalid values:

```text
-1%
100.01%
101%
```

## Security

Test that:

- Client cannot override final price
- User cannot use another tenant's discount type
- Unauthorized staff cannot perform restricted discount actions

## Historical Integrity

Create a membership with:

```text
Student
37.5%
250
```

Change Student configuration or deactivate Student.

Verify the membership still contains:

```text
37.5%
250
```

---

# 22. UI/UX Requirements

Keep the first version simple.

Do not introduce:

- Complex discount rules
- Automatic student verification
- Coupon systems
- Promotion campaigns
- Date-based discount engines
- Multiple simultaneous discounts
- Discount stacking

These can be future features.

The first version should answer one question:

> "Why is this member paying less than the normal plan price?"

Answer:

```text
Discount Type + Discount %
```

---

# 23. Suggested Implementation Order

Implement in this order:

### Step 1 — Database

Create:

```text
DiscountType
```

Add membership fields required for discount snapshotting.

Run migration.

### Step 2 — Seed

Create the seven default discount types for existing/new tenants as appropriate.

### Step 3 — Backend

Implement:

```text
Discount Type CRUD
Tenant isolation
Authorization
Validation
```

### Step 4 — Settings UI

Create:

```text
Settings → Discount Types
```

with add/edit/activate/deactivate.

### Step 5 — Membership Backend

Modify membership creation/update logic.

Backend calculates:

```text
finalPrice
```

and ignores/rejects any client attempt to override it.

### Step 6 — Membership UI

Add:

```text
Discount Type
Discount %
Final Price
```

with Final Price read-only.

### Step 7 — Permissions

Integrate with the existing role/permission system.

### Step 8 — Tests

Run all relevant unit/integration/e2e tests.

### Step 9 — Migration Verification

Verify existing memberships and imported tenant data.

### Step 10 — Production Verification

Before deploying, verify:

- Existing memberships unchanged
- New membership without discount works
- Student discount works
- 100% discount requires proper authorization
- Final price cannot be manipulated
- Tenant isolation works

---

# 24. Definition of Done

This feature is complete when:

- [ ] `DiscountType` exists with tenant isolation
- [ ] Default discount types are available
- [ ] Owner/admin can manage discount types
- [ ] Discount types can be deactivated without destroying historical data
- [ ] Membership supports discount information
- [ ] Discount percentage is validated from 0 to 100
- [ ] Final price is calculated server-side
- [ ] Final price is read-only in the UI
- [ ] Client cannot override final price
- [ ] Discount type belongs to the current tenant
- [ ] Existing memberships remain unchanged
- [ ] Historical discount values are preserved
- [ ] Existing authorization system is respected
- [ ] Tests cover calculation, security, tenant isolation, and historical integrity
- [ ] Existing migration/import data remains financially correct

---

# 25. Scope Control

This feature is intentionally limited.

### IN SCOPE

```text
Discount Types
Discount Percentage
Final Price Calculation
Membership Discount Snapshot (creation + renewal)
Permissions
Tenant Isolation
Settings UI
Membership Creation & Renewal UI
Validation
Tests
```

### OUT OF SCOPE

```text
Automatic discount rules
Coupon codes
Promotion campaigns
Student verification
Multiple discounts
Discount stacking
Complex reporting
Scheduled discounts
Approval workflows
Locker rental pricing (keeps its current freeform finalPrice for now)
Training program / course pricing (keeps its current freeform finalPrice for now)
Surcharges / pricing above plan price
```

Do not expand the implementation beyond this scope without first discussing it.

---

# Final Expected Flow

The final user experience should be:

```text
Settings
   ↓
Discount Types
   ↓
Student / Employee / Family / ...
   ↓
Member Registration
   ↓
Select Membership Plan
   ↓
Regular Price = 400 ₪
   ↓
Select Discount Type = Student
   ↓
Enter Discount = 37.5%
   ↓
System calculates Final Price = 250 ₪
   ↓
Backend validates and stores the values
   ↓
Membership is created
```

The fundamental business rule is:

> **The membership plan defines the regular price. The discount explains why the member pays less. The system calculates the final price. The employee never directly sets the final price.**
