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
  sex?: "male" | "female";
  idNumber?: string;
  address?: string;
  areaId?: string;
  joinDate?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  pictureUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
  debt: number;
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

export type PinDispatchResult = {
  whatsapp?: { sent: boolean; reason?: string };
  email?: { sent: boolean; reason?: string };
};

export async function createMember(data: {
  fullName: string;
  homeBranchId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  sex?: "male" | "female";
  idNumber?: string;
  address?: string;
  areaId?: string;
  height?: number;
  weight?: number;
  registeredEmployeeId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  rfidTag?: string;
}): Promise<Member & { pinDispatch?: PinDispatchResult }> {
  const response = await authedFetch("/members", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as {
    member: Member & { pinDispatch?: PinDispatchResult };
  };
  return payload.member;
}

export async function updateMember(
  memberId: string,
  data: {
    fullName?: string;
    homeBranchId?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    joinDate?: string;
    sex?: "male" | "female";
    idNumber?: string;
    address?: string;
    areaId?: string;
    height?: number;
    weight?: number;
    registeredEmployeeId?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalNotes?: string;
    rfidTag?: string;
  }
): Promise<Member> {
  const response = await authedFetch(`/members/${memberId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { member: Member };
  return payload.member;
}

export async function uploadMemberPhoto(
  memberId: string,
  file: File,
): Promise<Member> {
  const cookieHeader = await getCookieHeader();
  const fd = new FormData();
  fd.append("picture", file);

  const response = await fetch(`${apiBaseUrl}/members/${memberId}/photo`, {
    method: "POST",
    headers: { cookie: cookieHeader },
    body: fd,
    cache: "no-store",
  });

  if (response.status === 401) redirect("/signin");
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Upload failed: ${response.status}`);
  }

  const payload = (await response.json()) as { member: Member };
  return payload.member;
}

export function getMemberPhotoUrl(pictureUrl: string | undefined): string | null {
  if (!pictureUrl) return null;
  const apiRoot = apiBaseUrl.replace(/\/api$/, "");
  return `${apiRoot}${pictureUrl}`;
}

export async function getMemberDebt(memberId: string): Promise<number> {
  const response = await authedFetch(`/members/${memberId}/debt`);
  const payload = (await response.json()) as { debt: number };
  return payload.debt;
}

export async function setMemberPin(memberId: string, pin: string): Promise<void> {
  await authedFetch(`/members/${memberId}/pin`, {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function getMemberPin(memberId: string): Promise<{ pin: string | null }> {
  const response = await authedFetch(`/members/${memberId}/pin`);
  return (await response.json()) as { pin: string | null };
}

export async function resendMemberPin(memberId: string): Promise<PinDispatchResult> {
  const response = await authedFetch(`/members/${memberId}/pin/resend`, {
    method: "POST",
  });
  return (await response.json()) as PinDispatchResult;
}

export async function sendMemberQr(
  memberId: string,
): Promise<{ sent: boolean; reason?: string }> {
  const response = await authedFetch(`/members/${memberId}/send-qr`, {
    method: "POST",
  });
  if (response.status === 401) redirect("/signin");
  return response.json() as Promise<{ sent: boolean; reason?: string }>;
}
