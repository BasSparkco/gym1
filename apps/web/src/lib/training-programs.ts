import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type TrainingProgram = {
  id: string;
  tenantId: string;
  branchId: string | null;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  active: boolean;
  maxMembers?: number;
  defaultCoachId?: string | null;
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

export async function listTrainingPrograms(): Promise<TrainingProgram[]> {
  const response = await authedFetch("/training-programs");
  const payload = (await response.json()) as { programs: TrainingProgram[] };
  return payload.programs;
}

export async function getTrainingProgram(programId: string): Promise<TrainingProgram> {
  const response = await authedFetch(`/training-programs/${programId}`);
  const payload = (await response.json()) as { program: TrainingProgram };
  return payload.program;
}

export async function createTrainingProgram(data: {
  name: string;
  branchId?: string | null;
  description?: string;
  color?: string;
  maxMembers?: number;
  defaultCoachId?: string | null;
}): Promise<TrainingProgram> {
  const response = await authedFetch("/training-programs", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { program: TrainingProgram };
  return payload.program;
}

export async function updateTrainingProgram(
  programId: string,
  data: {
    name?: string;
    branchId?: string | null;
    description?: string;
    color?: string;
    active?: boolean;
    maxMembers?: number;
    defaultCoachId?: string | null;
  },
): Promise<TrainingProgram> {
  const response = await authedFetch(`/training-programs/${programId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { program: TrainingProgram };
  return payload.program;
}

export async function getEnrolledMemberIds(programId: string): Promise<string[]> {
  const response = await authedFetch(`/training-programs/${programId}/members`);
  const payload = (await response.json()) as { memberIds: string[] };
  return payload.memberIds;
}

export async function setEnrolledMemberIds(
  programId: string,
  memberIds: string[],
): Promise<string[]> {
  const response = await authedFetch(`/training-programs/${programId}/members`, {
    method: "PATCH",
    body: JSON.stringify({ memberIds }),
  });
  const payload = (await response.json()) as { memberIds: string[] };
  return payload.memberIds;
}

export async function getEntitledProgramIds(planId: string): Promise<string[] | "all"> {
  const response = await authedFetch(`/training-programs/plans/${planId}/entitled-programs`);
  const payload = (await response.json()) as { programIds: string[] | "all" };
  return payload.programIds;
}

export async function setEntitledProgramIds(
  planId: string,
  programIds: string[],
): Promise<string[] | "all"> {
  const response = await authedFetch(
    `/training-programs/plans/${planId}/entitled-programs`,
    { method: "PATCH", body: JSON.stringify({ programIds }) },
  );
  const payload = (await response.json()) as { programIds: string[] | "all" };
  return payload.programIds;
}
