import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ClassSessionStatus = "scheduled" | "cancelled" | "completed";

export type ClassSession = {
  id: string;
  tenantId: string;
  branchId: string;
  programId: string;
  coachId?: string | null;
  room?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: ClassSessionStatus;
  recurrenceId?: string | null;
  bookedCount: number;
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

export async function listClassSessions(filters?: {
  programId?: string;
}): Promise<ClassSession[]> {
  const query = filters?.programId ? `?programId=${filters.programId}` : "";
  const response = await authedFetch(`/class-sessions${query}`);
  const payload = (await response.json()) as { classSessions: ClassSession[] };
  return payload.classSessions;
}

export async function getClassSession(sessionId: string): Promise<ClassSession> {
  const response = await authedFetch(`/class-sessions/${sessionId}`);
  const payload = (await response.json()) as { classSession: ClassSession };
  return payload.classSession;
}

export type CreateClassSessionInput = {
  programId: string;
  branchId: string;
  coachId?: string | null;
  room?: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
};

export async function createClassSession(
  data: CreateClassSessionInput,
): Promise<ClassSession> {
  const response = await authedFetch("/class-sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { classSession: ClassSession };
  return payload.classSession;
}

export async function createRecurringClassSessions(
  data: CreateClassSessionInput & { repeatWeeks: number },
): Promise<{ recurrenceId: string; created: ClassSession[]; skipped: { date: string; reason: string }[] }> {
  const response = await authedFetch("/class-sessions/recurring", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function cancelClassSession(sessionId: string): Promise<ClassSession> {
  const response = await authedFetch(`/class-sessions/${sessionId}/cancel`, {
    method: "POST",
  });
  const payload = (await response.json()) as { classSession: ClassSession };
  return payload.classSession;
}
