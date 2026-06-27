import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Gate = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  genderRestriction: "male" | "female" | null;
  deviceUrl: string;
  deviceUsername: string;
  lockNumber: number;
  enabled: boolean;
  hasDevice: boolean;
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

export async function listGates(branchId?: string): Promise<Gate[]> {
  const url = branchId ? `/gates?branchId=${encodeURIComponent(branchId)}` : "/gates";
  const res = await authedFetch(url);
  const data = (await res.json()) as { gates: Gate[] };
  return data.gates;
}

export async function createGate(input: {
  branchId: string;
  name: string;
  genderRestriction: "male" | "female" | null;
  deviceUrl: string;
  deviceUsername: string;
  devicePassword: string;
  lockNumber: number;
  enabled: boolean;
}): Promise<Gate> {
  const res = await authedFetch("/gates", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { gate: Gate };
  return data.gate;
}

export async function updateGate(
  gateId: string,
  input: Partial<{
    name: string;
    genderRestriction: "male" | "female" | null;
    deviceUrl: string;
    deviceUsername: string;
    devicePassword: string;
    lockNumber: number;
    enabled: boolean;
  }>,
): Promise<Gate> {
  const res = await authedFetch(`/gates/${gateId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { gate: Gate };
  return data.gate;
}

export async function deleteGate(gateId: string): Promise<void> {
  await authedFetch(`/gates/${gateId}`, { method: "DELETE" });
}
