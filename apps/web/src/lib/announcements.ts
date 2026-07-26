import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Announcement = {
  id: string;
  tenantId: string;
  branchId: string | null;
  title: string;
  body: string;
  pushSentCount: number;
  pushFailedCount: number;
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

export async function listAnnouncements(): Promise<Announcement[]> {
  const res = await authedFetch("/announcements");
  const payload = (await res.json()) as { announcements: Announcement[] };
  return payload.announcements;
}

export async function createAnnouncement(data: {
  branchId?: string;
  title: string;
  body: string;
}): Promise<Announcement> {
  const res = await authedFetch("/announcements", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { announcement: Announcement };
  return payload.announcement;
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  await authedFetch(`/announcements/${announcementId}`, { method: "DELETE" });
}
