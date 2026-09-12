import { getNewRenewedMembershipsReport } from "@/lib/reports";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatDate, addDaysToDateString } from "@/lib/date-format";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Filter } from "lucide-react";

type SearchParams = {
  range?: string;
  dateFrom?: string;
  dateTo?: string;
  branch?: string;
  sex?: string;
};

type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

function firstOfMonth(dateStr: string) {
  return `${dateStr.slice(0, 7)}-01`;
}

export default async function NewRenewedMembershipsReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getT();
  const {
    range,
    dateFrom: dateFromParam,
    dateTo: dateToParam,
    branch: branchFilter,
    sex: sexFilter,
  } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const effectiveRange: RangeKey =
    (range as RangeKey) || (dateFromParam || dateToParam ? "custom" : "today");

  let dateFrom: string;
  let dateTo: string;
  if (effectiveRange === "yesterday") {
    dateFrom = addDaysToDateString(today, -1);
    dateTo = dateFrom;
  } else if (effectiveRange === "week") {
    dateFrom = addDaysToDateString(today, -6);
    dateTo = today;
  } else if (effectiveRange === "month") {
    dateFrom = firstOfMonth(today);
    dateTo = today;
  } else if (effectiveRange === "custom") {
    dateFrom = dateFromParam || today;
    dateTo = dateToParam || today;
  } else {
    dateFrom = today;
    dateTo = today;
  }

  const sex = sexFilter === "male" || sexFilter === "female" ? sexFilter : undefined;

  const [report, branches, settings] = await Promise.all([
    getNewRenewedMembershipsReport(dateFrom, dateTo, branchFilter, sex),
    listBranches(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";
  const currencySymbol = getCurrencySymbol(report.currency);
  const viewingAllBranches = session.role === "owner" && settings.ownerDataScope === "all";

  function presetHref(nextRange: RangeKey) {
    const params = new URLSearchParams();
    params.set("range", nextRange);
    if (branchFilter) params.set("branch", branchFilter);
    if (sexFilter) params.set("sex", sexFilter);
    return `/app/reports/new-renewed-memberships?${params.toString()}`;
  }

  const presets: { key: RangeKey; label: string }[] = [
    { key: "today", label: t.reports.rangeToday },
    { key: "yesterday", label: t.reports.rangeYesterday },
    { key: "week", label: t.reports.rangeWeek },
    { key: "month", label: t.reports.rangeMonth },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.reports}
        title={t.reports.newRenewedMemberships}
        description={
          <>
            {report.total} membership{report.total !== 1 ? "s" : ""} from {dateFrom} to {dateTo} —{" "}
            {report.newCount} {t.reports.newLabel.toLowerCase()}, {report.renewalCount}{" "}
            {t.reports.renewalLabel.toLowerCase()}.
          </>
        }
        actions={
          <Button href="/app/reports" variant="secondary" icon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}>
            {t.reports.allReports}
          </Button>
        }
      />

      <Card animate className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link
              key={p.key}
              href={presetHref(p.key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                effectiveRange === p.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-foreground/70 hover:border-brand/40"
              }`}
            >
              {p.label}
            </Link>
          ))}
          <span
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              effectiveRange === "custom"
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-foreground/40"
            }`}
          >
            {t.reports.rangeCustom}
          </span>
        </div>

        <form className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="range" value="custom" />
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-foreground/60">{t.reports.dateFromLabel}</span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-foreground/60">{t.reports.dateToLabel}</span>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm"
            />
          </label>
          {viewingAllBranches && (
            <label className="grid gap-1 text-sm">
              <span className="text-xs font-medium text-foreground/60">{t.members.homeBranch}</span>
              <select
                name="branch"
                defaultValue={branchFilter ?? ""}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm"
              >
                <option value="">{t.employees.filterAllBranches}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-foreground/60">{t.reports.sexCol}</span>
            <select
              name="sex"
              defaultValue={sexFilter ?? ""}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm"
            >
              <option value="">{t.reports.allSexesLabel}</option>
              <option value="male">{t.reports.maleLabel}</option>
              <option value="female">{t.reports.femaleLabel}</option>
            </select>
          </label>
          <Button type="submit" variant="primary" size="md" icon={<Filter className="h-4 w-4" strokeWidth={2} />}>
            {t.reports.applyFilter}
          </Button>
        </form>
      </Card>

      <Card animate delay={1}>
        {report.rows.length === 0 ? (
          <p className="text-sm text-foreground/40">{t.reports.noResults}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  <th className="pb-3 pe-4">{t.reports.memberCol}</th>
                  <th className="pb-3 pe-4">{t.reports.planCol}</th>
                  <th className="pb-3 pe-4">{t.reports.startCol}</th>
                  <th className="pb-3 pe-4">{t.reports.expiresCol}</th>
                  {viewingAllBranches && <th className="pb-3 pe-4">{t.members.homeBranch}</th>}
                  <th className="pb-3 pe-4">{t.reports.typeCol}</th>
                  <th className="pb-3 text-end">{t.reports.priceCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.rows.map((row) => (
                  <tr key={row.membershipId} className="py-3 transition-colors hover:bg-black/[0.02]">
                    <td className="py-3 pe-4">
                      <Link
                        href={`/app/members/${row.memberId}`}
                        className="font-medium hover:text-brand hover:underline"
                      >
                        {row.memberName ?? row.memberId}
                      </Link>
                      {row.memberNumber && (
                        <p className="font-mono text-xs text-foreground/50">{row.memberNumber}</p>
                      )}
                    </td>
                    <td className="py-3 pe-4 text-foreground/70">{row.planName ?? "—"}</td>
                    <td className="py-3 pe-4 font-mono text-xs text-foreground/60">{formatDate(row.startDate, dateFormat)}</td>
                    <td className="py-3 pe-4 font-mono text-xs text-foreground/60">{formatDate(row.endDate, dateFormat)}</td>
                    {viewingAllBranches && (
                      <td className="py-3 pe-4 text-foreground/70">{row.branchName ?? "—"}</td>
                    )}
                    <td className="py-3 pe-4">
                      <Badge tone={row.kind === "new" ? "success" : "info"}>
                        {row.kind === "new" ? t.reports.newLabel : t.reports.renewalLabel}
                      </Badge>
                    </td>
                    <td className="py-3 text-end font-medium">
                      {currencySymbol}
                      {row.finalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
