import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type MembershipPlan = {
  id: string;
  tenantId: string;
  name: string;
  planType: "duration" | "session";
  durationDays?: number;
  sessionCount?: number;
  price: number;
  allowAllBranches: boolean;
  freezeAllowed: boolean;
  freezeMaxDays?: number;
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

export async function listMembershipPlans(): Promise<MembershipPlan[]> {
  const res = await authedFetch("/memberships/plans");
  const payload = (await res.json()) as { plans: MembershipPlan[] };
  return payload.plans;
}

export async function getMembershipPlan(planId: string): Promise<MembershipPlan> {
  const res = await authedFetch(`/memberships/plans/${planId}`);
  const payload = (await res.json()) as { plan: MembershipPlan };
  return payload.plan;
}

export async function createMembershipPlan(data: {
  name: string;
  planType: "duration" | "session";
  durationDays?: number;
  sessionCount?: number;
  price: number;
  allowAllBranches: boolean;
  freezeAllowed: boolean;
  freezeMaxDays?: number;
}): Promise<MembershipPlan> {
  const res = await authedFetch("/memberships/plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { plan: MembershipPlan };
  return payload.plan;
}

export async function updateMembershipPlan(
  planId: string,
  data: Partial<{
    name: string;
    planType: "duration" | "session";
    durationDays: number;
    sessionCount: number;
    price: number;
    allowAllBranches: boolean;
    freezeAllowed: boolean;
    freezeMaxDays: number;
  }>
): Promise<MembershipPlan> {
  const res = await authedFetch(`/memberships/plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { plan: MembershipPlan };
  return payload.plan;
}
