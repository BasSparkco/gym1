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
  price: number;
  startDate: string | null;
  endDate: string | null;
};

export type ProgramScheduleSlot = {
  id: string;
  programId: string;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type ProgramEnrollmentStatus = "active" | "cancelled";

export type ProgramEnrollment = {
  memberId: string;
  programId: string;
  enrolledAt: string;
  finalPrice: number;
  status: ProgramEnrollmentStatus;
  member: {
    id: string;
    fullName: string;
    memberNumber: string;
  };
};

export type ProgramEnrollmentWithProgram = {
  memberId: string;
  programId: string;
  enrolledAt: string;
  finalPrice: number;
  status: ProgramEnrollmentStatus;
  program: TrainingProgram;
};

export type AttendanceStatus = "booked" | "waitlisted" | "attended" | "noShow" | "cancelled";

export type AttendanceReport = {
  program: TrainingProgram;
  sessions: { id: string; date: string; startTime: string; endTime: string }[];
  students: {
    memberId: string;
    fullName: string;
    memberNumber: string;
    finalPrice: number;
    enrollmentStatus: ProgramEnrollmentStatus;
    lessons: { sessionId: string; date: string; status: AttendanceStatus | null }[];
    totals: { totalLessons: number; attended: number; absent: number; pending: number };
  }[];
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
  price?: number;
  startDate?: string | null;
  endDate?: string | null;
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
    price?: number;
    startDate?: string | null;
    endDate?: string | null;
  },
): Promise<TrainingProgram> {
  const response = await authedFetch(`/training-programs/${programId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { program: TrainingProgram };
  return payload.program;
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

// ── Weekly schedule ──────────────────────────────────────────────────────────

export async function getScheduleSlots(programId: string): Promise<ProgramScheduleSlot[]> {
  const response = await authedFetch(`/training-programs/${programId}/schedule`);
  const payload = (await response.json()) as { slots: ProgramScheduleSlot[] };
  return payload.slots;
}

export async function setScheduleSlots(
  programId: string,
  slots: { dayOfWeek: number; startTime: string; endTime: string }[],
): Promise<ProgramScheduleSlot[]> {
  const response = await authedFetch(`/training-programs/${programId}/schedule`, {
    method: "PATCH",
    body: JSON.stringify({ slots }),
  });
  const payload = (await response.json()) as { slots: ProgramScheduleSlot[] };
  return payload.slots;
}

export async function generateProgramSessions(
  programId: string,
  branchId?: string,
): Promise<{ created: unknown[]; skipped: { date: string; reason: string }[] }> {
  const response = await authedFetch(`/training-programs/${programId}/generate-sessions`, {
    method: "POST",
    body: JSON.stringify(branchId ? { branchId } : {}),
  });
  return response.json();
}

// ── Registration (any member, priced independently of membership) ──────────

export async function listEnrollments(programId: string): Promise<ProgramEnrollment[]> {
  const response = await authedFetch(`/training-programs/${programId}/enrollments`);
  const payload = (await response.json()) as { enrollments: ProgramEnrollment[] };
  return payload.enrollments;
}

export async function listEnrollmentsForMember(
  memberId: string,
): Promise<ProgramEnrollmentWithProgram[]> {
  const response = await authedFetch(`/training-programs/enrollments/member/${memberId}`);
  const payload = (await response.json()) as { enrollments: ProgramEnrollmentWithProgram[] };
  return payload.enrollments;
}

export async function registerMemberForCourse(
  programId: string,
  memberId: string,
): Promise<ProgramEnrollment> {
  const response = await authedFetch(`/training-programs/${programId}/register`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
  const payload = (await response.json()) as { enrollment: ProgramEnrollment };
  return payload.enrollment;
}

export async function unregisterMemberFromCourse(
  programId: string,
  memberId: string,
): Promise<void> {
  await authedFetch(`/training-programs/${programId}/unregister`, {
    method: "POST",
    body: JSON.stringify({ memberId }),
  });
}

export async function getAttendanceReport(programId: string): Promise<AttendanceReport> {
  const response = await authedFetch(`/training-programs/${programId}/attendance-report`);
  return response.json();
}
