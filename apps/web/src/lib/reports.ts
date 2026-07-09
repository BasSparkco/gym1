import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export type ActiveMembershipRow = {
  membershipId: string;
  memberId: string;
  memberName: string | null;
  memberNumber: string | null;
  planName: string | null;
  startDate: string;
  endDate: string;
  finalPrice: number;
  status: string;
};

export type ExpiredMembershipRow = ActiveMembershipRow;

export type VisitRow = {
  visitId: string;
  memberId: string;
  memberName: string | null;
  memberNumber: string | null;
  branchId: string;
  checkInTime: string;
  accessMethod: "manual" | "qr";
};

export type PaymentRow = {
  paymentId: string;
  memberId: string;
  memberName: string | null;
  memberNumber: string | null;
  membershipId: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentMethod: string;
};

export async function getActiveMembershipsReport(): Promise<{
  rows: ActiveMembershipRow[];
  total: number;
  asOfDate: string;
  currency: string;
}> {
  const res = await authedFetch("/reports/active-memberships");
  return res.json() as Promise<{ rows: ActiveMembershipRow[]; total: number; asOfDate: string; currency: string }>;
}

export async function getExpiredMembershipsReport(): Promise<{
  rows: ExpiredMembershipRow[];
  total: number;
  asOfDate: string;
  currency: string;
}> {
  const res = await authedFetch("/reports/expired-memberships");
  return res.json() as Promise<{ rows: ExpiredMembershipRow[]; total: number; asOfDate: string; currency: string }>;
}

export async function getVisitsReport(
  dateFrom?: string,
  dateTo?: string,
): Promise<{ rows: VisitRow[]; total: number; dateFrom: string; dateTo: string }> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authedFetch(`/reports/visits${qs}`);
  return res.json() as Promise<{ rows: VisitRow[]; total: number; dateFrom: string; dateTo: string }>;
}

export async function getPaymentsReport(
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  rows: PaymentRow[];
  total: number;
  totalPaid: number;
  dateFrom: string;
  dateTo: string;
  currency: string;
}> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authedFetch(`/reports/payments${qs}`);
  return res.json() as Promise<{
    rows: PaymentRow[];
    total: number;
    totalPaid: number;
    dateFrom: string;
    dateTo: string;
    currency: string;
  }>;
}

export type MembersBySexRow = { sex: "male" | "female" | "unspecified"; total: number; active: number };

export async function getMembersBySexReport(): Promise<{
  rows: MembersBySexRow[];
  total: number;
  activeTotal: number;
  asOfDate: string;
}> {
  const res = await authedFetch("/reports/members-by-sex");
  return res.json() as Promise<{
    rows: MembersBySexRow[];
    total: number;
    activeTotal: number;
    asOfDate: string;
  }>;
}

export type EmployeeRegistrationRow = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  count: number;
};

export type MemberRegistrationRow = {
  memberId: string;
  memberName: string;
  memberNumber: string;
  joinDate: string | null;
  sex: "male" | "female" | null;
};

export async function getRegistrationsByEmployeeReport(
  employeeId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<
  | {
      kind: "summary";
      rows: EmployeeRegistrationRow[];
      unassignedCount: number;
      total: number;
      dateFrom: string | null;
      dateTo: string | null;
    }
  | {
      kind: "detail";
      employeeId: string;
      employeeName: string | null;
      rows: MemberRegistrationRow[];
      total: number;
      dateFrom: string | null;
      dateTo: string | null;
    }
> {
  const params = new URLSearchParams();
  if (employeeId) params.set("employeeId", employeeId);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authedFetch(`/reports/registrations-by-employee${qs}`);
  return res.json();
}

export type PlanPerformanceRow = {
  planId: string;
  planName: string;
  planType: "duration" | "session";
  count: number;
  revenue: number;
};

export async function getPlanPerformanceReport(
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  rows: PlanPerformanceRow[];
  total: number;
  totalRevenue: number;
  dateFrom: string;
  dateTo: string;
  currency: string;
}> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authedFetch(`/reports/plan-performance${qs}`);
  return res.json();
}

export type MembershipStatusRow = { status: string; count: number };

export async function getMembershipStatusBreakdownReport(): Promise<{
  rows: MembershipStatusRow[];
  total: number;
  asOfDate: string;
}> {
  const res = await authedFetch("/reports/membership-status-breakdown");
  return res.json();
}

export type ExpiringSoonRow = {
  membershipId: string;
  memberId: string;
  memberName: string | null;
  memberNumber: string | null;
  planName: string | null;
  endDate: string;
  finalPrice: number;
  status: string;
};

export async function getExpiringSoonReport(days?: number): Promise<{
  rows: ExpiringSoonRow[];
  total: number;
  asOfDate: string;
  days: number;
  currency: string;
}> {
  const qs = days ? `?days=${days}` : "";
  const res = await authedFetch(`/reports/expiring-soon${qs}`);
  return res.json();
}

export type UpcomingBirthdayRow = {
  memberId: string;
  memberName: string;
  memberNumber: string;
  phone: string | null;
  dateOfBirth: string;
  nextBirthday: string;
  daysUntil: number;
};

export async function getUpcomingBirthdaysReport(days?: number): Promise<{
  rows: UpcomingBirthdayRow[];
  total: number;
  asOfDate: string;
  days: number;
}> {
  const qs = days ? `?days=${days}` : "";
  const res = await authedFetch(`/reports/upcoming-birthdays${qs}`);
  return res.json();
}

export type NewMembersGrowthRow = { date: string; count: number };

export async function getNewMembersGrowthReport(
  dateFrom?: string,
  dateTo?: string,
): Promise<{
  rows: NewMembersGrowthRow[];
  total: number;
  dateFrom: string;
  dateTo: string;
}> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await authedFetch(`/reports/new-members-growth${qs}`);
  return res.json();
}
