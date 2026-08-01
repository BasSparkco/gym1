import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Employee = {
  id: string;
  tenantId: string;
  branchId: string;
  employeeNumber: string;
  fullName: string;
  status: "active" | "inactive";
  idNumber?: string;
  phone?: string;
  sex?: "male" | "female";
  dateOfBirth?: string;
  job?: string;
  salary?: number;
  workType?: "fullTime" | "partTime" | "trainee";
  startDate?: string;
  endDate?: string;
  isUser?: boolean;
  user?: { id: string; email: string } | null;
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

export async function listEmployees(): Promise<Employee[]> {
  const response = await authedFetch("/employees");
  const payload = (await response.json()) as { employees: Employee[] };
  return payload.employees;
}

export async function getEmployee(employeeId: string): Promise<Employee> {
  const response = await authedFetch(`/employees/${employeeId}`);
  const payload = (await response.json()) as { employee: Employee };
  return payload.employee;
}

export async function createEmployee(data: {
  fullName: string;
  branchId: string;
  idNumber?: string;
  phone?: string;
  sex?: "male" | "female";
  dateOfBirth?: string;
  job?: string;
  salary?: number;
  workType?: "fullTime" | "partTime" | "trainee";
  startDate?: string;
  endDate?: string;
  coachProfile?: { specializations?: string[]; certifications?: string[] };
}): Promise<Employee> {
  const response = await authedFetch("/employees", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { employee: Employee };
  return payload.employee;
}

export type CoachProfile = {
  employeeId: string;
  specializations: string[];
  certifications: string[];
};

export type Coach = Employee & { coachProfile: CoachProfile };

export async function listCoaches(): Promise<Coach[]> {
  const response = await authedFetch("/employees/coaches");
  const payload = (await response.json()) as { coaches: Coach[] };
  return payload.coaches;
}

export async function getCoachProfile(
  employeeId: string,
): Promise<CoachProfile | null> {
  const response = await authedFetch(`/employees/${employeeId}/coach-profile`);
  const payload = (await response.json()) as { coachProfile: CoachProfile | null };
  return payload.coachProfile;
}

export async function upsertCoachProfile(
  employeeId: string,
  data: { specializations?: string[]; certifications?: string[] },
): Promise<CoachProfile> {
  const response = await authedFetch(`/employees/${employeeId}/coach-profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { coachProfile: CoachProfile };
  return payload.coachProfile;
}

export async function removeCoachProfile(employeeId: string): Promise<void> {
  await authedFetch(`/employees/${employeeId}/coach-profile`, {
    method: "DELETE",
  });
}

export async function updateEmployee(
  employeeId: string,
  data: {
    fullName?: string;
    branchId?: string;
    status?: "active" | "inactive";
    idNumber?: string;
    phone?: string;
    sex?: "male" | "female";
    dateOfBirth?: string;
    job?: string;
    salary?: number;
    workType?: "fullTime" | "partTime" | "trainee";
    startDate?: string;
    endDate?: string;
  },
): Promise<Employee> {
  const response = await authedFetch(`/employees/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { employee: Employee };
  return payload.employee;
}
