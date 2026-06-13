import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

export default async function ReportsPage() {
  await requireSession();
  const t = await getT();

  const reports = [
    {
      href: "/app/reports/active-memberships",
      title: t.reports.activeMemberships,
      description: "Members with currently active memberships in this branch scope.",
    },
    {
      href: "/app/reports/expired-memberships",
      title: t.reports.expiredMemberships,
      description: "Memberships that have expired or reached their end date.",
    },
    {
      href: "/app/reports/visits",
      title: t.reports.visits,
      description: "Check-in records for today by default; filterable by date range.",
    },
    {
      href: "/app/reports/payments",
      title: t.reports.payments,
      description: "Payment records for today by default; filterable by date range.",
    },
  ];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.reports}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.reports.title}</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Operational reports for daily review. All data is scoped to your tenant and branch.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="rounded-[1.75rem] border border-line bg-surface px-6 py-5 transition hover:border-brand hover:shadow-sm"
          >
            <p className="font-semibold text-foreground">{report.title}</p>
            <p className="mt-1 text-sm text-foreground/55">{report.description}</p>
            <p className="mt-4 text-xs font-medium text-brand">{t.reports.viewReport}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
