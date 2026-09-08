// Seeded once per tenant (new tenant creation, and the one-off backfill for
// tenants that predate this feature). Not a hard-coded enum used anywhere in
// pricing logic — just starter rows the owner can rename/deactivate/extend,
// per discount.md §4. nameAr/nameHe are starting translations, editable like
// everything else.
export const DEFAULT_DISCOUNT_TYPES = [
  { name: 'Student', nameAr: 'طالب', nameHe: 'סטודנט' },
  { name: 'Employee', nameAr: 'موظف', nameHe: 'עובד' },
  { name: 'Family', nameAr: 'عائلة', nameHe: 'משפחה' },
  { name: 'Special Offer', nameAr: 'عرض خاص', nameHe: 'מבצע מיוחד' },
  { name: 'Renewal', nameAr: 'تجديد', nameHe: 'חידוש' },
  { name: 'Administrative', nameAr: 'إداري', nameHe: 'מנהלי' },
  { name: 'Other', nameAr: 'أخرى', nameHe: 'אחר' },
] as const;
