import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import {
  getActiveMembershipsReport,
  getExpiredMembershipsReport,
  getPaymentsReport,
  getVisitsReport,
  getMembersBySexReport,
  getRegistrationsByEmployeeReport,
  getPlanPerformanceReport,
  getMembershipStatusBreakdownReport,
  getExpiringSoonReport,
  getUpcomingBirthdaysReport,
  getNewMembersGrowthReport,
} from "@/lib/reports";
import Link from "next/link";

export default async function ReportsPage() {
  await requireSession();
  const t = await getT();

  const [
    active,
    expired,
    visits,
    payments,
    membersBySex,
    registrationsByEmployee,
    planPerformance,
    membershipStatus,
    expiringSoon,
    upcomingBirthdays,
    newMembersGrowth,
  ] = await Promise.all([
    getActiveMembershipsReport(),
    getExpiredMembershipsReport(),
    getVisitsReport(),
    getPaymentsReport(),
    getMembersBySexReport(),
    getRegistrationsByEmployeeReport(),
    getPlanPerformanceReport(),
    getMembershipStatusBreakdownReport(),
    getExpiringSoonReport(),
    getUpcomingBirthdaysReport(),
    getNewMembersGrowthReport(),
  ]);

  const reports = [
    {
      href: "/app/reports/active-memberships",
      title: t.reports.activeMemberships,
      description: "Members with currently active memberships in this branch scope.",
      count: active.total,
    },
    {
      href: "/app/reports/expired-memberships",
      title: t.reports.expiredMemberships,
      description: "Memberships that have expired or reached their end date.",
      count: expired.total,
    },
    {
      href: "/app/reports/visits",
      title: t.reports.visits,
      description: "Check-in records for today by default; filterable by date range.",
      count: visits.total,
    },
    {
      href: "/app/reports/payments",
      title: t.reports.payments,
      description: "Payment records for today by default; filterable by date range.",
      count: payments.total,
    },
    {
      href: "/app/reports/members-by-sex",
      title: t.reports.membersBySex,
      description: "Member headcount broken down by gender.",
      count: membersBySex.total,
    },
    {
      href: "/app/reports/registrations-by-employee",
      title: t.reports.registrationsByEmployee,
      description: "New members registered per employee, filterable by staff member and date.",
      count: registrationsByEmployee.total,
    },
    {
      href: "/app/reports/plan-performance",
      title: t.reports.planPerformance,
      description: "Memberships sold and revenue generated per plan this month.",
      count: planPerformance.total,
    },
    {
      href: "/app/reports/membership-status",
      title: t.reports.membershipStatusBreakdown,
      description: "Counts of active, frozen, expired, and cancelled memberships.",
      count: membershipStatus.total,
    },
    {
      href: "/app/reports/expiring-soon",
      title: t.reports.expiringSoon,
      description: "Active memberships ending within the next 7 days — for renewal outreach.",
      count: expiringSoon.total,
    },
    {
      href: "/app/reports/upcoming-birthdays",
      title: t.reports.upcomingBirthdays,
      description: "Members with a birthday in the next 30 days.",
      count: upcomingBirthdays.total,
    },
    {
      href: "/app/reports/new-members-growth",
      title: t.reports.newMembersGrowth,
      description: "New member joins per day this month.",
      count: newMembersGrowth.total,
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
            <div className="flex items-start justify-between gap-4">
              <p className="font-semibold text-foreground">{report.title}</p>
              <p className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
                {report.count.toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-sm text-foreground/55">{report.description}</p>
            <p className="mt-4 text-xs font-medium text-brand">{t.reports.viewReport}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
