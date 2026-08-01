/**
 * In-code default subject/body per notification template, in English only.
 * These are the fallback used whenever a tenant has no `NotificationTemplate`
 * row (or none in the requested language) — new tenants and tenants that
 * never touch the owner-editable templates page keep getting exactly this
 * text, unchanged from what used to be hardcoded at each call site.
 *
 * `templateKey` is deliberately more granular than `NotificationEvent`:
 * `membershipActivated` (initial sale) and `membershipRenewed` (renewal)
 * both fire under the `membershipActivated` event (one Settings toggle) but
 * need independently editable wording.
 */

export const NOTIFICATION_TEMPLATE_KEYS = [
  'membershipExpiring',
  'membershipExpired',
  'paymentPending',
  'membershipActivated',
  'membershipRenewed',
  'birthday',
] as const;

export type NotificationTemplateKey = (typeof NOTIFICATION_TEMPLATE_KEYS)[number];

export type NotificationTemplateDefault = {
  subject: string;
  body: string;
  /** Placeholder names usable in subject/body as `{{name}}`, shown to the
   * owner as hints on the edit page. */
  variables: string[];
};

export const DEFAULT_NOTIFICATION_TEMPLATES: Record<
  NotificationTemplateKey,
  NotificationTemplateDefault
> = {
  membershipExpiring: {
    subject: 'Membership expiring soon',
    body: 'Your membership expires on {{endDate}}. Renew now to keep your access.',
    variables: ['endDate'],
  },
  membershipExpired: {
    subject: 'Membership expired',
    body: 'Your membership has expired. Visit the front desk to renew.',
    variables: [],
  },
  paymentPending: {
    subject: 'Payment reminder',
    body: 'You have a pending payment of {{amount}} due on {{paymentDate}}. Please settle your balance at the front desk.',
    variables: ['amount', 'paymentDate'],
  },
  membershipActivated: {
    subject: 'Welcome to Spark Gym',
    body:
      'Your {{planName}} membership is now active and runs through {{endDate}}.\n\n' +
      'Download your QR code (show it at the entrance to enter):\n{{qrUrl}}',
    variables: ['planName', 'endDate', 'qrUrl'],
  },
  membershipRenewed: {
    subject: 'Membership renewed',
    body: 'Your {{planName}} membership has been renewed and now runs through {{endDate}}.',
    variables: ['planName', 'endDate'],
  },
  birthday: {
    subject: 'Happy Birthday!',
    body: 'Happy Birthday, {{memberName}}! Wishing you a great year ahead from all of us at the gym.',
    variables: ['memberName'],
  },
};

export function isNotificationTemplateKey(
  value: string,
): value is NotificationTemplateKey {
  return (NOTIFICATION_TEMPLATE_KEYS as readonly string[]).includes(value);
}

export function renderNotificationTemplate(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in variables ? variables[key] : match,
  );
}
