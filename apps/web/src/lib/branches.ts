import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Branch = {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  /** ISO 3166-1 alpha-2 country code (e.g. 'IL', 'PS'). */
  countryCode?: string;
  status: "active" | "inactive";
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

export async function listBranches(): Promise<Branch[]> {
  const response = await authedFetch("/branches");
  const payload = (await response.json()) as { branches: Branch[] };
  return payload.branches;
}

export async function getBranch(branchId: string): Promise<Branch> {
  const response = await authedFetch(`/branches/${branchId}`);
  const payload = (await response.json()) as { branch: Branch };
  return payload.branch;
}

export async function createBranch(data: {
  name: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  status?: "active" | "inactive";
}): Promise<Branch> {
  const response = await authedFetch("/branches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { branch: Branch };
  return payload.branch;
}

export async function updateBranch(
  branchId: string,
  data: {
    name?: string;
    address?: string;
    phone?: string;
    countryCode?: string;
    status?: "active" | "inactive";
  }
): Promise<Branch> {
  const response = await authedFetch(`/branches/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { branch: Branch };
  return payload.branch;
}

export async function switchBranch(branchId: string): Promise<void> {
  await authedFetch("/branches/switch", {
    method: "POST",
    body: JSON.stringify({ branchId }),
  });
}
