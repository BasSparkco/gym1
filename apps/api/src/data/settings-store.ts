import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API_ROOT_PATH = join(__dirname, '..', '..');
const SETTINGS_SEED_PATH = join(API_ROOT_PATH, 'data', 'settings-seed.json');
const SETTINGS_STORE_PATH = join(
  API_ROOT_PATH,
  '.local',
  'settings-store.json',
);

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

export type TenantSettingsRecord = {
  tenantId: string;
  defaultLanguage: Language;
  enabledLanguages: Language[];
  notificationSettings: NotificationSettings;
  notificationSenders: NotificationSenderSettings;
};

type SettingsStoreData = {
  tenants: TenantSettingsRecord[];
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
    channels: { sms: false, whatsapp: false, email: true },
  },
};

const defaultNotificationSenders: NotificationSenderSettings = {};

const defaultSettings: SettingsStoreData = {
  tenants: [
    {
      tenantId: 'tenant-spark-gym',
      defaultLanguage: 'en',
      enabledLanguages: ['en', 'ar', 'he'],
      notificationSettings: defaultNotificationSettings,
      notificationSenders: defaultNotificationSenders,
    },
  ],
};

export function readSettingsStore(): SettingsStoreData {
  ensureSettingsStoreFile();
  const raw = readFileSync(SETTINGS_STORE_PATH, 'utf8');
  return JSON.parse(raw) as SettingsStoreData;
}

export function writeSettingsStore(store: SettingsStoreData) {
  ensureSettingsStoreFile();
  writeFileSync(SETTINGS_STORE_PATH, JSON.stringify(store, null, 2) + '\n');
}

export function getDefaultTenantSettings(
  tenantId: string,
): TenantSettingsRecord {
  return {
    tenantId,
    defaultLanguage: 'en',
    enabledLanguages: ['en', 'ar', 'he'],
    notificationSettings: defaultNotificationSettings,
    notificationSenders: defaultNotificationSenders,
  };
}

function ensureSettingsStoreFile() {
  const dataDirectory = join(API_ROOT_PATH, 'data');
  const localDirectory = join(API_ROOT_PATH, '.local');

  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  if (!existsSync(localDirectory)) {
    mkdirSync(localDirectory, { recursive: true });
  }

  if (!existsSync(SETTINGS_SEED_PATH)) {
    writeFileSync(
      SETTINGS_SEED_PATH,
      JSON.stringify(defaultSettings, null, 2) + '\n',
    );
  }

  if (!existsSync(SETTINGS_STORE_PATH)) {
    const rawSeed = readFileSync(SETTINGS_SEED_PATH, 'utf8');
    writeFileSync(SETTINGS_STORE_PATH, rawSeed);
  }
}
