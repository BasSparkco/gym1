import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { MembershipPlan } from "@/lib/membership-plans";

export type Membership = {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "frozen" | "expired" | "cancelled";
  finalPrice: number;
  plan?: MembershipPlan | null;
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

export async function listAllMemberships(): Promise<Membership[]> {
  const res = await authedFetch("/memberships");
  const payload = (await res.json()) as { memberships: Membership[] };
  return payload.memberships;
}

export async function listMembershipsForMember(memberId: string): Promise<Membership[]> {
  const res = await authedFetch(`/memberships/member/${memberId}`);
  const payload = (await res.json()) as { memberships: Membership[] };
  return payload.memberships;
}

export async function createMembership(data: {
  memberId: string;
  planId: string;
  startDate: string;
  endDate?: string;
  finalPrice?: number;
  status?: Membership["status"];
}): Promise<Membership> {
  const res = await authedFetch("/memberships", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { membership: Membership };
  return payload.membership;
}

export type Freeze = {
  id: string;
  membershipId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export async function renewMembership(
  membershipId: string,
  data: { planId?: string; startDate?: string; finalPrice?: number },
): Promise<Membership> {
  const res = await authedFetch(`/memberships/${membershipId}/renew`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { membership: Membership };
  return payload.membership;
}

export async function listFreezesForMembership(membershipId: string): Promise<Freeze[]> {
  const res = await authedFetch(`/memberships/${membershipId}/freezes`);
  const payload = (await res.json()) as { freezes: Freeze[] };
  return payload.freezes;
}

export async function createFreeze(
  membershipId: string,
  data: { startDate: string; endDate: string },
): Promise<{ freeze: Freeze; membership: Membership }> {
  const res = await authedFetch(`/memberships/${membershipId}/freeze`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ freeze: Freeze; membership: Membership }>;
}

export async function unfreezeMembership(membershipId: string): Promise<Membership> {
  const res = await authedFetch(`/memberships/${membershipId}/unfreeze`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const payload = (await res.json()) as { membership: Membership };
  return payload.membership;
}
