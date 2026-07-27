import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type EmployeeVisit = {
  id: string;
  employeeId: string;
  branchId: string;
  checkInTime: string;
  checkOutTime: string | null;
  accessMethod: "manual" | "qr" | "rfid";
  gateId: string | null;
};

export type EmployeeCheckInResult =
  | { granted: false; reason: string }
  | {
      granted: true;
      employee: { id: string; fullName: string; employeeNumber: string };
      visit: EmployeeVisit;
    };

export type EmployeeGateAccess = {
  allowAllGates: boolean;
  gateIds: string[];
};

export type EmployeeAttendanceReport = {
  dateFrom: string;
  dateTo: string;
  employees: {
    employeeId: string;
    fullName: string;
    employeeNumber: string;
    days: {
      date: string;
      checkInTime: string;
      checkOutTime: string | null;
      hoursWorked: number;
    }[];
    totals: { daysPresent: number; totalHours: number };
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

export async function checkInEmployee(
  employeeIdentifier: string,
  accessMethod: "manual" | "qr" = "manual",
): Promise<EmployeeCheckInResult> {
  const res = await authedFetch("/employee-attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ employeeIdentifier, accessMethod }),
  });
  return (await res.json()) as EmployeeCheckInResult;
}

export async function checkOutEmployee(visitId: string): Promise<EmployeeVisit> {
  const res = await authedFetch(`/employee-attendance/check-out/${visitId}`, {
    method: "POST",
  });
  const data = (await res.json()) as { visit: EmployeeVisit };
  return data.visit;
}

export async function listEmployeeVisits(
  employeeId: string,
): Promise<EmployeeVisit[]> {
  const res = await authedFetch(`/employee-attendance/${employeeId}/visits`);
  const data = (await res.json()) as { visits: EmployeeVisit[] };
  return data.visits;
}

export async function getEmployeeGates(
  employeeId: string,
): Promise<EmployeeGateAccess> {
  const res = await authedFetch(`/employee-attendance/${employeeId}/gates`);
  return (await res.json()) as EmployeeGateAccess;
}

export async function setEmployeeGates(
  employeeId: string,
  input: EmployeeGateAccess,
): Promise<EmployeeGateAccess> {
  const res = await authedFetch(`/employee-attendance/${employeeId}/gates`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return (await res.json()) as EmployeeGateAccess;
}

export async function getEmployeeAttendanceReport(
  dateFrom: string,
  dateTo: string,
): Promise<EmployeeAttendanceReport> {
  const res = await authedFetch(
    `/employee-attendance/attendance-report?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`,
  );
  return (await res.json()) as EmployeeAttendanceReport;
}
