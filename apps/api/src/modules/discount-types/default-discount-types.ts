// Seeded once per tenant (new tenant creation, and the one-off backfill for
// tenants that predate this feature). Not a hard-coded enum used anywhere in
// pricing logic — just starter rows the owner can rename/deactivate/extend,
// per discount.md §4.
export const DEFAULT_DISCOUNT_TYPE_NAMES = [
  'Student',
  'Employee',
  'Family',
  'Special Offer',
  'Renewal',
  'Administrative',
  'Other',
] as const;
