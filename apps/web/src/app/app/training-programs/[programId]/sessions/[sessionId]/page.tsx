"use server";

import { getTrainingProgram } from "@/lib/training-programs";
import { getClassSession, cancelClassSession } from "@/lib/class-sessions";
import {
  listBookingsForSession,
  bookClass,
  cancelClassBooking,
  markClassBookingAttendance,
} from "@/lib/class-bookings";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";
import { CalendarCheck, XCircle } from "lucide-react";

type Props = {
  params: Promise<{ programId: string; sessionId: string }>;
};

const bookingStatusLabelKey = {
  booked: "bookingBooked",
  waitlisted: "bookingWaitlisted",
  attended: "bookingAttended",
  noShow: "bookingNoShow",
  cancelled: "bookingCancelled",
} as const;

const bookingStatusTone: Record<string, BadgeTone> = {
  booked: "success",
  waitlisted: "warning",
  attended: "info",
  noShow: "neutral",
};

export default async function ClassSessionDetailPage({ params }: Props) {
  const { programId, sessionId } = await params;
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager" && session.role !== "front-desk") {
    redirect("/app/dashboard");
  }

  const canManage = session.role === "owner" || session.role === "manager";

  const [program, classSession, bookings, branches, coaches, members] = await Promise.all([
    getTrainingProgram(programId),
    getClassSession(sessionId),
    listBookingsForSession(sessionId),
    listBranches(),
    listCoaches(),
    listMembers(),
  ]);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const coachMap = new Map(coaches.map((c) => [c.id, c.fullName]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const bookedMemberIds = new Set(
    bookings.filter((b) => b.status === "booked" || b.status === "waitlisted").map((b) => b.memberId),
  );
  const bookableMembers = members.filter((m) => !bookedMemberIds.has(m.id));

  async function handleBook(formData: FormData) {
    "use server";
    const memberId = formData.get("memberId") as string;
    await bookClass({ classSessionId: sessionId, memberId });
    redirect(`/app/training-programs/${programId}/sessions/${sessionId}`);
  }

  async function handleCancelBooking(formData: FormData) {
    "use server";
    const bookingId = formData.get("bookingId") as string;
    await cancelClassBooking(bookingId);
    redirect(`/app/training-programs/${programId}/sessions/${sessionId}`);
  }

  async function handleMarkAttendance(formData: FormData) {
    "use server";
    const bookingId = formData.get("bookingId") as string;
    const status = formData.get("status") as "attended" | "noShow";
    await markClassBookingAttendance(bookingId, status);
    redirect(`/app/training-programs/${programId}/sessions/${sessionId}`);
  }

  async function handleCancelSession() {
    "use server";
    await cancelClassSession(sessionId);
    redirect(`/app/training-programs/${programId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={program.name}
        title={t.classes.sessionDetails}
        description={
          <>
            {classSession.date} · {classSession.startTime.slice(11, 16)}–{classSession.endTime.slice(11, 16)} ·{" "}
            {branchMap.get(classSession.branchId) ?? classSession.branchId}
            {classSession.room ? ` · ${classSession.room}` : ""}
            {classSession.coachId ? ` · ${coachMap.get(classSession.coachId) ?? classSession.coachId}` : ""}
          </>
        }
        actions={
          <Button href={`/app/training-programs/${programId}`} variant="secondary">
            {program.name}
          </Button>
        }
      />

      <Card animate delay={1}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.classes.bookingsTitle}
          </p>
          <Badge tone="outline">
            {classSession.bookedCount}/{classSession.capacity} {t.classes.bookedCount.toLowerCase()}
          </Badge>
        </div>

        <div className="mt-4 grid gap-2">
          {activeBookings.length === 0 && (
            <p className="text-sm text-foreground/60">{t.classes.noBookings}</p>
          )}
          {activeBookings.map((booking) => {
            const member = memberMap.get(booking.memberId);
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{member?.fullName ?? booking.memberId}</p>
                  <p className="text-xs text-foreground/50">{member?.memberNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={bookingStatusTone[booking.status] ?? "neutral"}>
                    {t.classes[bookingStatusLabelKey[booking.status]]}
                  </Badge>
                  {canManage &&
                    (booking.status === "booked" ||
                      booking.status === "attended" ||
                      booking.status === "noShow") && (
                      <>
                        {booking.status !== "attended" && (
                          <form action={handleMarkAttendance}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="status" value="attended" />
                            <Button type="submit" variant="primary" size="sm">
                              {t.classes.markPresent}
                            </Button>
                          </form>
                        )}
                        {booking.status !== "noShow" && (
                          <form action={handleMarkAttendance}>
                            <input type="hidden" name="bookingId" value={booking.id} />
                            <input type="hidden" name="status" value="noShow" />
                            <Button type="submit" variant="secondary" size="sm">
                              {t.classes.markAbsent}
                            </Button>
                          </form>
                        )}
                      </>
                    )}
                  {(booking.status === "booked" || booking.status === "waitlisted") && (
                    <form action={handleCancelBooking}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <Button type="submit" variant="danger" size="sm">
                        {t.classes.cancelBooking}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {classSession.status === "scheduled" && bookableMembers.length > 0 && (
          <form action={handleBook} className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-1.5">
              <label htmlFor="memberId" className="text-sm font-medium">{t.classes.bookMember}</label>
              <select id="memberId" name="memberId" required defaultValue="" className={inputCls}>
                <option value="" disabled>{t.classes.selectMember}</option>
                {bookableMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName} ({m.memberNumber})</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" icon={<CalendarCheck className="h-4 w-4" strokeWidth={2} />}>
              {t.classes.book}
            </Button>
          </form>
        )}
      </Card>

      {canManage && classSession.status === "scheduled" && (
        <form action={handleCancelSession}>
          <Button type="submit" variant="danger" icon={<XCircle className="h-4 w-4" strokeWidth={2} />}>
            {t.classes.cancelSession}
          </Button>
        </form>
      )}
    </div>
  );
}
