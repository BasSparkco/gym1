import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Area = {
  id: string;
  tenantId: string;
  name: string;
};

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore.toString();
}

async function authedFetch(path: string, init?: RequestInit) {
  const cookieHeader = await getCookieHeader();
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

export async function listAreas(): Promise<Area[]> {
  const response = await authedFetch("/areas");
  const payload = (await response.json()) as { areas: Area[] };
  return payload.areas;
}

export async function createArea(name: string): Promise<Area> {
  const response = await authedFetch("/areas", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const payload = (await response.json()) as { area: Area };
  return payload.area;
}
