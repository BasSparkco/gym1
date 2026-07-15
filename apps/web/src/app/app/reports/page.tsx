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
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

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
      description: t.reports.activeMembershipsCardDescription,
      count: active.total,
    },
    {
      href: "/app/reports/expired-memberships",
      title: t.reports.expiredMemberships,
      description: t.reports.expiredMembershipsCardDescription,
      count: expired.total,
    },
    {
      href: "/app/reports/visits",
      title: t.reports.visits,
      description: t.reports.visitsCardDescription,
      count: visits.total,
    },
    {
      href: "/app/reports/payments",
      title: t.reports.payments,
      description: t.reports.paymentsCardDescription,
      count: payments.total,
    },
    {
      href: "/app/reports/members-by-sex",
      title: t.reports.membersBySex,
      description: t.reports.membersBySexCardDescription,
      count: membersBySex.total,
    },
    {
      href: "/app/reports/registrations-by-employee",
      title: t.reports.registrationsByEmployee,
      description: t.reports.registrationsByEmployeeCardDescription,
      count: registrationsByEmployee.total,
    },
    {
      href: "/app/reports/plan-performance",
      title: t.reports.planPerformance,
      description: t.reports.planPerformanceCardDescription,
      count: planPerformance.total,
    },
    {
      href: "/app/reports/membership-status",
      title: t.reports.membershipStatusBreakdown,
      description: t.reports.membershipStatusCardDescription,
      count: membershipStatus.total,
    },
    {
      href: "/app/reports/expiring-soon",
      title: t.reports.expiringSoon,
      description: t.reports.expiringSoonCardDescription,
      count: expiringSoon.total,
    },
    {
      href: "/app/reports/upcoming-birthdays",
      title: t.reports.upcomingBirthdays,
      description: t.reports.upcomingBirthdaysCardDescription,
      count: upcomingBirthdays.total,
    },
    {
      href: "/app/reports/new-members-growth",
      title: t.reports.newMembersGrowth,
      description: t.reports.newMembersGrowthCardDescription,
      count: newMembersGrowth.total,
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.title}
        description={t.reports.indexDescription}
      />

      <section className="grid gap-3 sm:grid-cols-2">
        {reports.map((report, index) => (
          <Card
            key={report.href}
            as={Link}
            href={report.href}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-semibold text-foreground">{report.title}</p>
              <p className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
                {report.count.toLocaleString()}
              </p>
            </div>
            <p className="mt-1 text-sm text-foreground/55">{report.description}</p>
            <p className="mt-4 text-xs font-medium text-brand">{t.reports.viewReport}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
