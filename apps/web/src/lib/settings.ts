import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Language = "en" | "ar" | "he";

export type DateFormat = "dd/mm/yyyy" | "mm/dd/yyyy";

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

export const defaultNotificationSettings: NotificationSettings = {
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
    channels: { sms: false, whatsapp: false, email: true, app: false },
  },
  birthday: {
    enabled: false,
    channels: { sms: false, whatsapp: true, email: false, app: false },
  },
};

export type NotificationSenderSettings = {
  /** Reserved for future paid SMS tier. */
  smsFrom?: string;
  /** Sender address shown in the email "from" field (used by SMTP). */
  emailFrom?: string;
};

export const defaultNotificationSenders: NotificationSenderSettings = {};

export type OwnerDataScope = "all" | "activeBranch";

/** Whether the tenant shows one logo across all branches, or lets each
 * branch have its own. */
export type LogoMode = "shared" | "perBranch";

export type TenantSettings = {
  name: string;
  tenantId: string;
  defaultLanguage: Language;
  enabledLanguages: Language[];
  notificationSettings: NotificationSettings;
  notificationSenders: NotificationSenderSettings;
  dateFormat: DateFormat;
  checkOutTrackingEnabled: boolean;
  ownerDataScope: OwnerDataScope;
  /** ISO 4217 currency code (e.g. 'ILS'). */
  reportingCurrencyCode: string;
  logoMode: LogoMode;
  logoUrl: string | null;
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  ar: "العربية",
  he: "עברית",
};

export const LANG_COOKIE = "spark_gym_lang";

async function authedFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/signin");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}

export function getLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  const apiRoot = apiBaseUrl.replace(/\/api$/, "");
  return `${apiRoot}${logoUrl}`;
}

export async function getSettings(): Promise<TenantSettings> {
  const response = await authedFetch("/settings");
  const payload = (await response.json()) as { settings: TenantSettings };
  return payload.settings;
}

export async function updateSettings(data: {
  name?: string;
  defaultLanguage?: Language;
  enabledLanguages?: Language[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
  dateFormat?: DateFormat;
  checkOutTrackingEnabled?: boolean;
  ownerDataScope?: OwnerDataScope;
  reportingCurrencyCode?: string;
  logoMode?: LogoMode;
}): Promise<TenantSettings> {
  const response = await authedFetch("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { settings: TenantSettings };
  return payload.settings;
}
