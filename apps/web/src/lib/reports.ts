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
}> {
  const res = await authedFetch("/reports/active-memberships");
  return res.json() as Promise<{ rows: ActiveMembershipRow[]; total: number; asOfDate: string }>;
}

export async function getExpiredMembershipsReport(): Promise<{
  rows: ExpiredMembershipRow[];
  total: number;
  asOfDate: string;
}> {
  const res = await authedFetch("/reports/expired-memberships");
  return res.json() as Promise<{ rows: ExpiredMembershipRow[]; total: number; asOfDate: string }>;
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
  }>;
}
