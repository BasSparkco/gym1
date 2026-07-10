/**
 * Tenant-settings types plus the default settings a new tenant starts with
 * (also used by the e2e test reset). The JSON-file store this module used to
 * manage was replaced by Postgres/Prisma in July 2026; only the shared types
 * and defaults remain.
 */

export type Language = 'en' | 'ar' | 'he';

export type NotificationChannel = 'sms' | 'whatsapp' | 'email';

export type NotificationEventRule = {
  enabled: boolean;
  channels: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
  };
};

export type MembershipExpiringRule = NotificationEventRule & {
  daysBefore: number;
};

export type NotificationSettings = {
  membershipExpiring: MembershipExpiringRule;
  membershipExpired: NotificationEventRule;
  paymentPending: NotificationEventRule;
  membershipActivated: NotificationEventRule;
};

export type NotificationSenderSettings = {
  /** Reserved for future paid SMS tier. */
  smsFrom?: string;
  /** Sender email address shown in the "from" field (required by SMTP). */
  emailFrom?: string;
};

export type DateFormat = 'dd/mm/yyyy' | 'mm/dd/yyyy';

/** What the owner sees across list/report pages: every branch in the
 * tenant, or only the branch they're currently switched into. */
export type OwnerDataScope = 'all' | 'activeBranch';

export type TenantSettingsRecord = {
  tenantId: string;
  defaultLanguage: Language;
  enabledLanguages: Language[];
  notificationSettings: NotificationSettings;
  notificationSenders: NotificationSenderSettings;
  dateFormat: DateFormat;
  checkOutTrackingEnabled: boolean;
  ownerDataScope: OwnerDataScope;
  reportingCurrencyCode: string;
};

const defaultNotificationSettings: NotificationSettings = {
  membershipExpiring: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: false },
    daysBefore: 3,
  },
  membershipExpired: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: false },
  },
  paymentPending: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: false },
  },
  membershipActivated: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: true },
  },
};

const defaultNotificationSenders: NotificationSenderSettings = {};

export function getDefaultTenantSettings(
  tenantId: string,
): TenantSettingsRecord {
  return {
    tenantId,
    defaultLanguage: 'en',
    enabledLanguages: ['en', 'ar', 'he'],
    notificationSettings: defaultNotificationSettings,
    notificationSenders: defaultNotificationSenders,
    dateFormat: 'dd/mm/yyyy' as DateFormat,
    checkOutTrackingEnabled: true,
    ownerDataScope: 'all',
    reportingCurrencyCode: 'ILS',
  };
}
