import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ClosedDate = {
  id: string;
  tenantId: string;
  branchId: string | null;
  date: string;
  reason: string;
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

export async function listClosedDates(): Promise<ClosedDate[]> {
  const res = await authedFetch("/closed-dates");
  const payload = (await res.json()) as { closedDates: ClosedDate[] };
  return payload.closedDates;
}

export async function createClosedDate(data: {
  branchId?: string;
  date: string;
  reason: string;
}): Promise<ClosedDate> {
  const res = await authedFetch("/closed-dates", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { closedDate: ClosedDate };
  return payload.closedDate;
}

export async function deleteClosedDate(closedDateId: string): Promise<void> {
  await authedFetch(`/closed-dates/${closedDateId}`, { method: "DELETE" });
}
