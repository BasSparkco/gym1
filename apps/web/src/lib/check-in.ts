import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type CheckInResult =
  | { granted: false; reason: string }
  | {
      granted: true;
      member: { id: string; fullName: string; memberNumber: string; status: string };
      membership: {
        id: string;
        planId: string;
        startDate: string;
        endDate: string;
        status: string;
        finalPrice: number;
        plan: { name: string } | null;
      };
      visit: { id: string; memberId: string; branchId: string; checkInTime: string; checkOutTime: string | null; accessMethod: string };
    };

export async function performCheckIn(
  memberIdentifier: string,
  accessMethod: "manual" | "qr",
): Promise<CheckInResult> {
  const cookieStore = await cookies();
  const response = await fetch(`${apiBaseUrl}/visits/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieStore.toString(),
    },
    body: JSON.stringify({ memberIdentifier, accessMethod }),
    cache: "no-store",
  });

  if (response.status === 401) redirect("/signin");

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Check-in request failed: ${response.status}`);
  }

  return (await response.json()) as CheckInResult;
}
