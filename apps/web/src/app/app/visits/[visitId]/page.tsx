"use server";

import { getVisit, checkOutVisit } from "@/lib/visits";
import { getMember } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type Props = { params: Promise<{ visitId: string }> };

export default async function VisitDetailPage({ params }: Props) {
  const { visitId } = await params;
  await requireSession();
  const t = await getT();

  const visit = await getVisit(visitId);

  let member = null;
  try {
    member = await getMember(visit.memberId);
  } catch {
    // member may be out of scope; render with available data
  }

  async function handleCheckOut() {
    "use server";
    await checkOutVisit(visitId);
    revalidatePath(`/app/visits/${visitId}`);
  }

  const localCheckInTime = new Date(visit.checkInTime).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "medium",
  });
  const localCheckOutTime = visit.checkOutTime
    ? new Date(visit.checkOutTime).toLocaleString("en-US", {
        dateStyle: "long",
        timeStyle: "medium",
      })
    : null;

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.visits}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.visits.visitDetail}</h1>
          <p className="mt-1 font-mono text-sm text-foreground/50">{visit.id}</p>
        </div>
        <Link
          href="/app/visits"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.visits.allVisits}
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.visits.visitInfo}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.visits.checkInTime}</dt>
              <dd className="mt-0.5 font-medium">{localCheckInTime}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.visits.checkOutTime}</dt>
              <dd className="mt-0.5">
                {localCheckOutTime ? (
                  <span className="font-medium">{localCheckOutTime}</span>
                ) : (
                  <form action={handleCheckOut}>
                    <button
                      type="submit"
                      className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand/90"
                    >
                      {t.visits.checkOut}
                    </button>
                  </form>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.visits.accessMethod}</dt>
              <dd className="mt-0.5">
                <span
                  className={[
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    visit.accessMethod === "qr"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {visit.accessMethod === "qr" ? t.visits.qrScan : t.visits.manualEntry}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.visits.branch}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{visit.branchId}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.visits.member}</p>
          {member ? (
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-foreground/55">{t.members.fullName}</dt>
                <dd className="mt-0.5 font-medium">{member.fullName}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.memberNumber}</dt>
                <dd className="mt-0.5 font-mono font-medium">{member.memberNumber}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.members.statusLabel}</dt>
                <dd className="mt-0.5">
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      member.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {member.status === "active" ? t.status.active : t.status.inactive}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 font-mono text-xs text-foreground/50">{visit.memberId}</p>
          )}
          {member && (
            <div className="mt-4">
              <Link
                href={`/app/members/${member.id}`}
                className="text-xs font-medium text-brand hover:underline"
              >
                {t.visits.viewMemberProfile}
              </Link>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
