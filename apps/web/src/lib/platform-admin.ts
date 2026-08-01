import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type PlatformAdminSessionUser = {
  id: string;
  email: string;
  name: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  createdAt: string;
  branchCount: number;
  ownerEmail: string | null;
  status: "active" | "paused";
  pausedReason: string | null;
  pausedAt: string | null;
};

export type BranchInput = {
  name: string;
  address?: string;
  phone?: string;
  countryCode?: string;
  operatingCurrencyCode?: string;
};

export type OwnerInput = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type CreateTenantInput = {
  tenantName: string;
  branch: BranchInput;
  owner: OwnerInput;
};

export type AddBranchInput = {
  branch: BranchInput;
  owner: OwnerInput;
};

export type BranchSummary = {
  id: string;
  name: string;
  address: string | null;
  countryCode: string | null;
  operatingCurrencyCode: string;
  status: "active" | "inactive";
  ownerEmail: string | null;
};

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
    redirect("/platform-admin/login");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}

export async function getPlatformAdminSession(): Promise<PlatformAdminSessionUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/platform-admin/auth/current-session`, {
    method: "GET",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load the current platform-admin session.");
  }

  const payload = (await response.json()) as { admin: PlatformAdminSessionUser };
  return payload.admin;
}

export async function requirePlatformAdminSession(): Promise<PlatformAdminSessionUser> {
  const admin = await getPlatformAdminSession();

  if (!admin) {
    redirect("/platform-admin/login");
  }

  return admin;
}

export async function listTenants(): Promise<TenantSummary[]> {
  const response = await authedFetch("/platform-admin/tenants");
  const payload = (await response.json()) as { tenants: TenantSummary[] };
  return payload.tenants;
}

export async function createTenant(input: CreateTenantInput): Promise<TenantSummary> {
  const response = await authedFetch("/platform-admin/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as { tenant: TenantSummary };
  return payload.tenant;
}

export async function updateTenantName(tenantId: string, name: string): Promise<TenantSummary> {
  const response = await authedFetch(`/platform-admin/tenants/${tenantId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  const payload = (await response.json()) as { tenant: TenantSummary };
  return payload.tenant;
}

export async function pauseTenant(tenantId: string, reason: string): Promise<TenantSummary> {
  const response = await authedFetch(`/platform-admin/tenants/${tenantId}/pause`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
  const payload = (await response.json()) as { tenant: TenantSummary };
  return payload.tenant;
}

export async function resumeTenant(tenantId: string): Promise<TenantSummary> {
  const response = await authedFetch(`/platform-admin/tenants/${tenantId}/resume`, {
    method: "PATCH",
  });
  const payload = (await response.json()) as { tenant: TenantSummary };
  return payload.tenant;
}

export async function listBranches(tenantId: string): Promise<BranchSummary[]> {
  const response = await authedFetch(`/platform-admin/tenants/${tenantId}/branches`);
  const payload = (await response.json()) as { branches: BranchSummary[] };
  return payload.branches;
}

export async function addBranch(
  tenantId: string,
  input: AddBranchInput,
): Promise<BranchSummary> {
  const response = await authedFetch(`/platform-admin/tenants/${tenantId}/branches`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as { branch: BranchSummary };
  return payload.branch;
}
