"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  updateEmployeeAction,
  toggleEmployeeStatusAction,
  setEmployeeGatesAction,
  resendEmployeeQrAction,
} from "@/app/app/employees/actions";
import { EmployeeProfileView } from "@/components/employees/employee-profile-view";
import type { Employee, CoachProfile } from "@/lib/employees";
import type { Branch } from "@/lib/branches";
import type { Gate } from "@/lib/gates";
import type { EmployeeGateAccess, EmployeeVisit } from "@/lib/employee-attendance";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { UserRound, PencilLine, MessageCircle } from "lucide-react";

// Card accent border color by gender (css.md convention): blue for male,
// rose for female, black when unspecified — kept as its own helper since
// it's a lookup on data, not a fixed per-card token like the rest of css.md.
function genderBorderClass(sex: Employee["sex"]): string {
  if (sex === "male") return "border-s-blue-500";
  if (sex === "female") return "border-s-rose-500";
  return "border-s-black";
}

type Props = {
  employees: Employee[];
  branches: Branch[];
  branchMap: Record<string, string>;
  coachProfilesByEmployee: Record<string, CoachProfile | null>;
  allGates: Gate[];
  gateAccessByEmployee: Record<string, EmployeeGateAccess>;
  recentVisitsByEmployee: Record<string, EmployeeVisit[]>;
  dateFormat: DateFormat;
  t: Dict;
};

export function EmployeeList({
  employees,
  branches,
  branchMap,
  coachProfilesByEmployee,
  allGates,
  gateAccessByEmployee,
  recentVisitsByEmployee,
  dateFormat,
  t,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedPanelRef = useRef<HTMLDivElement | null>(null);

  // The expanded edit panel renders as a new full-width grid row right after
  // its card, which can land well below the fold when the card being edited
  // is further down the page — scroll it into view so the opened form is
  // actually visible instead of silently appearing off-screen.
  useEffect(() => {
    if (expandedId) {
      expandedPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expandedId]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {employees.map((emp, index) => {
        const expanded = expandedId === emp.id;
        const isCoach = coachProfilesByEmployee[emp.id] != null;

        return (
          <Fragment key={emp.id}>
            <Card
              hoverable
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              className={cn(
                "flex flex-col border-s-4 transition-shadow",
                genderBorderClass(emp.sex),
                isCoach && "border-e-4 border-e-orange-500",
                expanded && "ring-2 ring-brand ring-offset-2 ring-offset-background",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-foreground/30">
                    <UserRound className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{emp.fullName}</h2>
                </div>
                <Badge tone={emp.status === "active" ? "success" : "neutral"}>
                  {emp.status === "active" ? t.employees.active : t.employees.inactive}
                </Badge>
              </div>

              <div className="mt-3 min-h-10">
                <p className="text-sm text-foreground/55 font-mono">{emp.employeeNumber}</p>
                <p className="mt-0.5 text-sm text-foreground/60">
                  {t.employees.branch}: {branchMap[emp.branchId] ?? emp.branchId}
                </p>
                {emp.user && (
                  <p className="mt-0.5 text-sm text-foreground/60">
                    {t.users.email}: <span className="font-mono">{emp.user.email}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant={expanded ? "primary" : "secondary"}
                  size="sm"
                  className="flex-1"
                  aria-pressed={expanded}
                  icon={<PencilLine className="h-3.5 w-3.5" strokeWidth={2} />}
                  onClick={() => setExpandedId(expanded ? null : emp.id)}
                >
                  {t.actions.edit}
                </Button>
                {emp.phone && (
                  <form action={resendEmployeeQrAction} className="flex-1">
                    <input type="hidden" name="employeeId" value={emp.id} />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                    >
                      {t.employees.resendQrWhatsApp}
                    </Button>
                  </form>
                )}
              </div>
            </Card>

            {expanded && (
              <div
                ref={expandedPanelRef}
                className="animate-fade-in-up rounded-[18px] border border-line bg-surface-muted/40 px-5 py-6 sm:px-7 md:col-span-2 xl:col-span-3"
              >
                <EmployeeProfileView
                  employee={emp}
                  coachProfile={coachProfilesByEmployee[emp.id] ?? null}
                  branches={branches}
                  branchMap={branchMap}
                  dateFormat={dateFormat}
                  currencySymbol=""
                  canEdit
                  t={t}
                  updateAction={updateEmployeeAction}
                  toggleStatusAction={toggleEmployeeStatusAction}
                  gates={allGates}
                  gateAccess={gateAccessByEmployee[emp.id]}
                  setGatesAction={setEmployeeGatesAction}
                  recentVisits={recentVisitsByEmployee[emp.id]}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </section>
  );
}
