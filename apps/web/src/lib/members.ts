import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Member = {
  id: string;
  tenantId: string;
  homeBranchId: string;
  memberNumber: string;
  fullName: string;
  status: "active" | "inactive";
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
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

export async function listMembers(): Promise<Member[]> {
  const response = await authedFetch("/members");
  const payload = (await response.json()) as { members: Member[] };
  return payload.members;
}

export async function getMember(memberId: string): Promise<Member> {
  const response = await authedFetch(`/members/${memberId}`);
  const payload = (await response.json()) as { member: Member };
  return payload.member;
}

export async function createMember(data: {
  fullName: string;
  homeBranchId?: string;
  status?: "active" | "inactive";
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}): Promise<Member> {
  const response = await authedFetch("/members", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { member: Member };
  return payload.member;
}

export async function updateMember(
  memberId: string,
  data: {
    fullName?: string;
    homeBranchId?: string;
    status?: "active" | "inactive";
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalNotes?: string;
  }
): Promise<Member> {
  const response = await authedFetch(`/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { member: Member };
  return payload.member;
}
