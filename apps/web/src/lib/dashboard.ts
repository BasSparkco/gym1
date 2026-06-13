import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type DashboardCard = {
  id: "active-memberships" | "expiring-memberships" | "today-check-ins" | "payments-logged";
  label: string;
  value: string;
  tone: "bg-white" | "bg-surface-muted";
  helperText: string;
};

type DashboardSummaryResponse = {
  cards: DashboardCard[];
  quickActions: string[];
  scope: {
    tenantId: string;
    tenantName: string;
    branchId: string;
    branchName: string;
    role: "owner" | "manager" | "front-desk";
    asOfDate: string;
  };
  generatedAt: string;
};

export async function getDashboardSummary() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    redirect("/signin");
  }

  const response = await fetch(`${apiBaseUrl}/reports/dashboard-summary`, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/signin");
  }

  if (!response.ok) {
    throw new Error("Unable to load the dashboard summary.");
  }

  return (await response.json()) as DashboardSummaryResponse;
}