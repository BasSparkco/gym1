"use server";

import { getTrainingProgram } from "@/lib/training-programs";
import { getClassSession, cancelClassSession } from "@/lib/class-sessions";
import {
  listBookingsForSession,
  bookClass,
  cancelClassBooking,
} from "@/lib/class-bookings";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  async function handleCancelSession() {
    "use server";
    await cancelClassSession(sessionId);
    redirect(`/app/training-programs/${programId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {program.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.classes.sessionDetails}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {classSession.date} · {classSession.startTime.slice(11, 16)}–{classSession.endTime.slice(11, 16)} ·{" "}
            {branchMap.get(classSession.branchId) ?? classSession.branchId}
            {classSession.room ? ` · ${classSession.room}` : ""}
            {classSession.coachId ? ` · ${coachMap.get(classSession.coachId) ?? classSession.coachId}` : ""}
          </p>
        </div>
        <Link
          href={`/app/training-programs/${programId}`}
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {program.name}
        </Link>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.classes.bookingsTitle}
          </p>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium">
            {classSession.bookedCount}/{classSession.capacity} {t.classes.bookedCount.toLowerCase()}
          </span>
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
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      booking.status === "booked" && "bg-green-100 text-green-700",
                      booking.status === "waitlisted" && "bg-amber-100 text-amber-700",
                      booking.status === "attended" && "bg-blue-100 text-blue-700",
                      booking.status === "noShow" && "bg-gray-100 text-gray-500",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {t.classes[bookingStatusLabelKey[booking.status]]}
                  </span>
                  {(booking.status === "booked" || booking.status === "waitlisted") && (
                    <form action={handleCancelBooking}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        {t.classes.cancelBooking}
                      </button>
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
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.classes.book}
            </button>
          </form>
        )}
      </section>

      {canManage && classSession.status === "scheduled" && (
        <form action={handleCancelSession}>
          <button
            type="submit"
            className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            {t.classes.cancelSession}
          </button>
        </form>
      )}
    </div>
  );
}
