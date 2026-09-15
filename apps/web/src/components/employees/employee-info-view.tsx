"use client";

import type { ReactNode } from "react";
import { formatDate, formatDateTime } from "@/lib/date-format";
import { computeAge, isRtlText } from "@/components/members/member-profile-shared";
import { PhoneNumber } from "@/components/phone-number";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee, CoachProfile } from "@/lib/employees";
import type { Gate } from "@/lib/gates";
import type { EmployeeGateAccess, EmployeeVisit } from "@/lib/employee-attendance";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import {
  UserRound,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  History,
  QrCode,
  PencilLine,
} from "lucide-react";

// A compact, read-only "at a glance" view of an employee — distinct from
// EmployeeProfileView (which doubles as the edit form): grouped field chips
// under icon-led section headers instead of a bordered-card-per-section /
// hero-header layout, so it reads as its own surface rather than a re-skin
// of the member profile page or the employee edit form.

type Props = {
  employee: Employee;
  coachProfile: CoachProfile | null;
  branchMap: Record<string, string>;
  currencySymbol: string;
  dateFormat: DateFormat;
  t: Dict;
  gates: Gate[];
  gateAccess: EmployeeGateAccess;
  recentVisits: EmployeeVisit[];
  checkOutTrackingEnabled: boolean;
  onEditClick: () => void;
};

function Field({ label, value, dir }: { label: string; value: ReactNode; dir?: "ltr" | "rtl" }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">{label}</span>
      <span dir={dir} className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
        {value}
      </span>
    </div>
  );
}

function Section({
  icon,
  iconClassName,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
            {icon}
          </span>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70">{title}</h3>
        </div>
        {action}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function EmployeeInfoView({
  employee,
  coachProfile,
  branchMap,
  currencySymbol,
  dateFormat,
  t,
  gates,
  gateAccess,
  recentVisits,
  checkOutTrackingEnabled,
  onEditClick,
}: Props) {
  const workTypeLabel = {
    fullTime: t.employees.fullTime,
    partTime: t.employees.partTime,
    trainee: t.employees.trainee,
  } as Record<string, string>;

  const age = computeAge(employee.dateOfBirth);

  return (
    <div className="grid gap-4">
      {/* Quick facts + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={employee.status === "active" ? "success" : "neutral"}>
            {employee.status === "active" ? t.employees.active : t.employees.inactive}
          </Badge>
          {coachProfile && (
            <Badge tone="brand" icon={<GraduationCap className="h-3 w-3" strokeWidth={2} />}>
              {t.employees.isCoach}
            </Badge>
          )}
          {employee.user && (
            <Badge tone="info" icon={<ShieldCheck className="h-3 w-3" strokeWidth={2} />}>
              {t.employees.isUser}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`/app/employees/${employee.id}/qr`} variant="secondary" size="sm" icon={<QrCode className="h-3.5 w-3.5" strokeWidth={2} />}>
            {t.attendance.qrCode}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onEditClick} icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}>
            {t.actions.edit}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section icon={<UserRound className="h-3.5 w-3.5" strokeWidth={2} />} iconClassName="bg-brand/10 text-brand" title={t.employees.personalInfo}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Field label={t.employees.fullName} value={employee.fullName} dir={isRtlText(employee.fullName) ? "rtl" : undefined} />
            <Field label={t.employees.idNumber} value={employee.idNumber} />
            <Field label={t.employees.phone} value={employee.phone && <PhoneNumber value={employee.phone} />} />
            <Field label={t.employees.gender} value={employee.sex && (employee.sex === "male" ? t.employees.male : t.employees.female)} />
            <Field
              label={t.employees.dateOfBirth}
              value={
                employee.dateOfBirth && (
                  <>
                    {formatDate(employee.dateOfBirth, dateFormat)}
                    {age !== null && <span className="ms-1 font-normal text-foreground/45">· {age}</span>}
                  </>
                )
              }
            />
          </div>
        </Section>

        <Section icon={<Briefcase className="h-3.5 w-3.5" strokeWidth={2} />} iconClassName="bg-blue-50 text-blue-700" title={t.employees.employmentInfo}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Field label={t.employees.branch} value={branchMap[employee.branchId] ?? employee.branchId} />
            <Field label={t.employees.job} value={employee.job} />
            <Field label={t.employees.salary} value={employee.salary !== undefined && `${currencySymbol}${employee.salary}`} />
            <Field label={t.employees.workType} value={employee.workType && (workTypeLabel[employee.workType] ?? employee.workType)} />
            <Field label={t.employees.startDate} value={employee.startDate && formatDate(employee.startDate, dateFormat)} />
            <Field label={t.employees.endDate} value={employee.endDate && formatDate(employee.endDate, dateFormat)} />
          </div>
        </Section>
      </div>

      {coachProfile && (
        <Section icon={<GraduationCap className="h-3.5 w-3.5" strokeWidth={2} />} iconClassName="bg-violet-50 text-violet-700" title={t.classes.coachProfileTitle}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <Field label={t.classes.specializations} value={coachProfile.specializations.join(", ") || "—"} />
            <Field label={t.classes.certifications} value={coachProfile.certifications.join(", ") || "—"} />
          </div>
        </Section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Section icon={<KeyRound className="h-3.5 w-3.5" strokeWidth={2} />} iconClassName="bg-purple-50 text-purple-700" title={t.attendance.gateAccess}>
          <p className="text-sm text-foreground/75">
            {gateAccess.gateAccessScope === "branch" && t.attendance.allGates}
            {gateAccess.gateAccessScope === "organization" && t.attendance.allOrgGates}
            {gateAccess.gateAccessScope === "selected" &&
              `${t.attendance.selectedGatesOnly}: ${
                gates
                  .filter((g) => gateAccess.gateIds.includes(g.id))
                  .map((g) => g.name)
                  .join(", ") || "—"
              }`}
          </p>
        </Section>

        <Section icon={<History className="h-3.5 w-3.5" strokeWidth={2} />} iconClassName="bg-emerald-50 text-emerald-700" title={t.attendance.recentAttendance}>
          {recentVisits.length === 0 ? (
            <p className="text-sm text-foreground/55">{t.attendance.noRecentAttendance}</p>
          ) : (
            <ul className="grid gap-1.5">
              {recentVisits.map((visit) => (
                <li key={visit.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted/60 px-3 py-1.5 text-sm">
                  <span>{formatDateTime(visit.checkInTime, dateFormat)}</span>
                  {checkOutTrackingEnabled && (
                    <span className="text-foreground/55">
                      {visit.checkOutTime ? formatDateTime(visit.checkOutTime, dateFormat) : t.attendance.stillCheckedIn}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
