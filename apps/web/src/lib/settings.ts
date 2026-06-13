import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Language = "en" | "ar" | "he";

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

export const defaultNotificationSettings: NotificationSettings = {
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

export type NotificationSenderSettings = {
  /** Reserved for future paid SMS tier. */
  smsFrom?: string;
  /** Sender address shown in the email "from" field (used by SMTP). */
  emailFrom?: string;
};

export const defaultNotificationSenders: NotificationSenderSettings = {};

export type TenantSettings = {
  tenantId: string;
  defaultLanguage: Language;
  enabledLanguages: Language[];
  notificationSettings: NotificationSettings;
  notificationSenders: NotificationSenderSettings;
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

export async function getSettings(): Promise<TenantSettings> {
  const response = await authedFetch("/settings");
  const payload = (await response.json()) as { settings: TenantSettings };
  return payload.settings;
}

export async function updateSettings(data: {
  defaultLanguage?: Language;
  enabledLanguages?: Language[];
  notificationSettings?: NotificationSettings;
  notificationSenders?: NotificationSenderSettings;
}): Promise<TenantSettings> {
  const response = await authedFetch("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { settings: TenantSettings };
  return payload.settings;
}
