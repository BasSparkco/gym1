/**
 * Tenant-settings types plus the default settings a new tenant starts with
 * (also used by the e2e test reset). The JSON-file store this module used to
 * manage was replaced by Postgres/Prisma in July 2026; only the shared types
 * and defaults remain.
 */

export type Language = 'en' | 'ar' | 'he';

export type NotificationChannel = 'sms' | 'whatsapp' | 'email' | 'app';

export type NotificationEventRule = {
  enabled: boolean;
  channels: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    app: boolean;
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
  birthday: NotificationEventRule;
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

/** Whether the tenant shows one logo across all branches, or lets each
 * branch have its own. */
export type LogoMode = 'shared' | 'perBranch';

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
  logoMode: LogoMode;
  logoUrl: string | null;
};

const defaultNotificationSettings: NotificationSettings = {
  membershipExpiring: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: false, app: false },
    daysBefore: 3,
  },
  membershipExpired: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: false, app: false },
  },
  paymentPending: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: false, app: false },
  },
  membershipActivated: {
    enabled: true,
    channels: { sms: false, whatsapp: true, email: true, app: false },
  },
  // Off by default: unlike the other events, this is a brand-new automatic
  // message that didn't exist before — existing tenants shouldn't suddenly
  // start messaging members without the owner opting in.
  birthday: {
    enabled: false,
    channels: { sms: false, whatsapp: true, email: false, app: false },
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
    dateFormat: 'dd/mm/yyyy',
    checkOutTrackingEnabled: true,
    ownerDataScope: 'all',
    reportingCurrencyCode: 'ILS',
    logoMode: 'shared',
    logoUrl: null,
  };
}
