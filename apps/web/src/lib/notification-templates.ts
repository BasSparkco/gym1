import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Language } from "@/lib/settings";

export const NOTIFICATION_TEMPLATE_KEYS = [
  "membershipExpiring",
  "membershipExpired",
  "paymentPending",
  "membershipActivated",
  "membershipRenewed",
  "birthday",
] as const;

export type NotificationTemplateKey = (typeof NOTIFICATION_TEMPLATE_KEYS)[number];

export type NotificationTemplate = {
  templateKey: NotificationTemplateKey;
  lang: Language;
  subject: string;
  body: string;
  variables: string[];
  isCustomized: boolean;
};

async function authedFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (response.status === 401) redirect("/signin");

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}

export async function listNotificationTemplates(): Promise<NotificationTemplate[]> {
  const res = await authedFetch("/notifications/templates");
  const payload = (await res.json()) as { templates: NotificationTemplate[] };
  return payload.templates;
}

export async function saveNotificationTemplate(
  templateKey: NotificationTemplateKey,
  lang: Language,
  subject: string,
  body: string,
): Promise<void> {
  await authedFetch(`/notifications/templates/${templateKey}/${lang}`, {
    method: "PUT",
    body: JSON.stringify({ subject, body }),
  });
}

export async function resetNotificationTemplate(
  templateKey: NotificationTemplateKey,
  lang: Language,
): Promise<void> {
  await authedFetch(`/notifications/templates/${templateKey}/${lang}`, {
    method: "DELETE",
  });
}
