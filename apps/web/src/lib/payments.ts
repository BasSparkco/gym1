import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Payment = {
  id: string;
  tenantId: string;
  branchId: string;
  memberId: string;
  membershipId: string;
  amount: number;
  paymentDate: string;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  paymentMethod: "cash" | "card" | "transfer";
};

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

export async function listPaymentsForMember(memberId: string): Promise<Payment[]> {
  const res = await authedFetch(`/payments/member/${memberId}`);
  const payload = (await res.json()) as { payments: Payment[] };
  return payload.payments;
}

export async function createPayment(data: {
  memberId: string;
  membershipId: string;
  amount: number;
  paymentDate: string;
  status?: Payment["status"];
  paymentMethod?: Payment["paymentMethod"];
  branchId?: string;
}): Promise<Payment> {
  const res = await authedFetch("/payments", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { payment: Payment };
  return payload.payment;
}
