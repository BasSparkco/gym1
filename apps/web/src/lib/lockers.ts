import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type LockerSize = "small" | "medium" | "large";
export type LockerStatus = "available" | "occupied" | "maintenance";
export type LockerRentalStatus = "active" | "expired" | "cancelled";

export type Locker = {
  id: string;
  tenantId: string;
  branchId: string;
  lockerNumber: string;
  size: LockerSize | null;
  monthlyPrice: number;
  status: LockerStatus;
};

export type LockerRental = {
  id: string;
  lockerId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  status: LockerRentalStatus;
  finalPrice: number;
  locker?: Locker;
};

export type LockerDetail = Locker & {
  activeRental:
    | (LockerRental & { member: { id: string; fullName: string; memberNumber: string } })
    | null;
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

export async function listLockers(options?: { branchId?: string; memberId?: string }): Promise<Locker[]> {
  const params = new URLSearchParams();
  if (options?.branchId) params.set("branchId", options.branchId);
  if (options?.memberId) params.set("memberId", options.memberId);
  const query = params.toString();
  const res = await authedFetch(query ? `/lockers?${query}` : "/lockers");
  const payload = (await res.json()) as { lockers: Locker[] };
  return payload.lockers;
}

export async function getLocker(lockerId: string): Promise<LockerDetail> {
  const res = await authedFetch(`/lockers/${lockerId}`);
  const payload = (await res.json()) as { locker: LockerDetail };
  return payload.locker;
}

export async function createLocker(data: {
  branchId: string;
  lockerNumber: string;
  size?: LockerSize | null;
  monthlyPrice: number;
}): Promise<Locker> {
  const res = await authedFetch("/lockers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { locker: Locker };
  return payload.locker;
}

export async function createLockersBulk(data: {
  branchId: string;
  startNumber: string;
  quantity: number;
  size?: LockerSize | null;
  monthlyPrice: number;
}): Promise<Locker[]> {
  const res = await authedFetch("/lockers/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { lockers: Locker[] };
  return payload.lockers;
}

export async function updateLocker(
  lockerId: string,
  data: Partial<{
    lockerNumber: string;
    size: LockerSize | null;
    monthlyPrice: number;
    status: LockerStatus;
  }>,
): Promise<Locker> {
  const res = await authedFetch(`/lockers/${lockerId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { locker: Locker };
  return payload.locker;
}

export async function deleteLocker(lockerId: string): Promise<void> {
  await authedFetch(`/lockers/${lockerId}`, { method: "DELETE" });
}

export async function listLockerRentalsForMember(memberId: string): Promise<LockerRental[]> {
  const res = await authedFetch(`/lockers/rentals/member/${memberId}`);
  const payload = (await res.json()) as { rentals: LockerRental[] };
  return payload.rentals;
}

export async function createLockerRental(data: {
  lockerId: string;
  memberId: string;
  startDate: string;
  endDate?: string;
  finalPrice?: number;
}): Promise<LockerRental> {
  const res = await authedFetch("/lockers/rentals", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await res.json()) as { rental: LockerRental };
  return payload.rental;
}

export async function cancelLockerRental(rentalId: string): Promise<LockerRental> {
  const res = await authedFetch(`/lockers/rentals/${rentalId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  const payload = (await res.json()) as { rental: LockerRental };
  return payload.rental;
}
