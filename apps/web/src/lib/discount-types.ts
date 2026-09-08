import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type DiscountType = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export async function listDiscountTypes(options?: { includeInactive?: boolean }): Promise<DiscountType[]> {
  const query = options?.includeInactive ? "?includeInactive=true" : "";
  const res = await authedFetch(`/discount-types${query}`);
  const payload = (await res.json()) as { discountTypes: DiscountType[] };
  return payload.discountTypes;
}

export async function getDiscountType(discountTypeId: string): Promise<DiscountType> {
  const res = await authedFetch(`/discount-types/${discountTypeId}`);
  const payload = (await res.json()) as { discountType: DiscountType };
  return payload.discountType;
}

export async function createDiscountType(data: {
  name: string;
  description?: string;
}): Promise<DiscountType> {
  const res = await authedFetch("/discount-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { discountType: DiscountType };
  return payload.discountType;
}

export async function updateDiscountType(
  discountTypeId: string,
  data: { name?: string; description?: string | null; isActive?: boolean },
): Promise<DiscountType> {
  const res = await authedFetch(`/discount-types/${discountTypeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { discountType: DiscountType };
  return payload.discountType;
}

export async function deactivateDiscountType(discountTypeId: string): Promise<DiscountType> {
  const res = await authedFetch(`/discount-types/${discountTypeId}/deactivate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const payload = (await res.json()) as { discountType: DiscountType };
  return payload.discountType;
}

export async function reactivateDiscountType(discountTypeId: string): Promise<DiscountType> {
  const res = await authedFetch(`/discount-types/${discountTypeId}/reactivate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const payload = (await res.json()) as { discountType: DiscountType };
  return payload.discountType;
}
