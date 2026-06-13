import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Notification = {
  id: string;
  tenantId: string;
  memberId: string;
  channel: "sms" | "whatsapp" | "email";
  subject: string;
  body: string;
  status: "pending" | "sent" | "failed";
  sentAt?: string;
  failedReason?: string;
  createdAt: string;
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

export async function listNotifications(): Promise<Notification[]> {
  const res = await authedFetch("/notifications");
  const payload = (await res.json()) as { notifications: Notification[] };
  return payload.notifications;
}

export async function getNotification(notificationId: string): Promise<Notification> {
  const res = await authedFetch(`/notifications/${notificationId}`);
  const payload = (await res.json()) as { notification: Notification };
  return payload.notification;
}
