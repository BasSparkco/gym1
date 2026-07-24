import "server-only";

import { apiBaseUrl } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ClassBookingStatus =
  | "booked"
  | "waitlisted"
  | "attended"
  | "noShow"
  | "cancelled";

export type ClassBooking = {
  id: string;
  classSessionId: string;
  memberId: string;
  membershipId: string | null;
  status: ClassBookingStatus;
  bookedAt: string;
  cancelledAt?: string | null;
  visitId?: string | null;
  member?: { id: string; fullName: string; memberNumber: string };
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

export async function listBookingsForSession(
  classSessionId: string,
): Promise<ClassBooking[]> {
  const response = await authedFetch(`/class-bookings/session/${classSessionId}`);
  const payload = (await response.json()) as { bookings: ClassBooking[] };
  return payload.bookings;
}

export async function listBookingsForMember(
  memberId: string,
): Promise<ClassBooking[]> {
  const response = await authedFetch(`/class-bookings/member/${memberId}`);
  const payload = (await response.json()) as { bookings: ClassBooking[] };
  return payload.bookings;
}

export async function bookClass(data: {
  classSessionId: string;
  memberId: string;
}): Promise<ClassBooking> {
  const response = await authedFetch("/class-bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
  const payload = (await response.json()) as { booking: ClassBooking };
  return payload.booking;
}

export async function cancelClassBooking(bookingId: string): Promise<ClassBooking> {
  const response = await authedFetch(`/class-bookings/${bookingId}/cancel`, {
    method: "POST",
  });
  const payload = (await response.json()) as { booking: ClassBooking };
  return payload.booking;
}

export async function markClassBookingAttendance(
  bookingId: string,
  status: "attended" | "noShow",
): Promise<ClassBooking> {
  const response = await authedFetch(`/class-bookings/${bookingId}/attendance`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  const payload = (await response.json()) as { booking: ClassBooking };
  return payload.booking;
}
