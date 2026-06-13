import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Visit = {
  id: string;
  memberId: string;
  branchId: string;
  checkInTime: string;
  checkOutTime: string | null;
  accessMethod: "manual" | "qr";
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

export async function listVisits(): Promise<Visit[]> {
  const res = await authedFetch("/visits");
  const payload = (await res.json()) as { visits: Visit[] };
  return payload.visits;
}

export async function getVisit(visitId: string): Promise<Visit> {
  const res = await authedFetch(`/visits/${visitId}`);
  const payload = (await res.json()) as { visit: Visit };
  return payload.visit;
}

export async function checkOutVisit(visitId: string): Promise<Visit> {
  const res = await authedFetch(`/visits/${visitId}/check-out`, { method: "POST" });
  const payload = (await res.json()) as { visit: Visit };
  return payload.visit;
}
