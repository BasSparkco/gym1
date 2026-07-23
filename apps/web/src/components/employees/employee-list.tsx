"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DateInput from "@/components/date-input";
import { updateEmployeeAction, toggleEmployeeStatusAction } from "@/app/app/employees/actions";
import type { Employee, CoachProfile } from "@/lib/employees";
import type { Branch } from "@/lib/branches";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { Save, Ban, CheckCircle2 } from "lucide-react";

type Props = {
  employees: Employee[];
  branches: Branch[];
  branchMap: Record<string, string>;
  coachProfilesByEmployee: Record<string, CoachProfile | null>;
  dateFormat: DateFormat;
  t: Dict;
};

const inputCls =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function EmployeeList({ employees, branches, branchMap, coachProfilesByEmployee, dateFormat, t }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="grid gap-3">
      {employees.map((emp, index) => {
        const expanded = expandedId === emp.id;
        const coachProfile = coachProfilesByEmployee[emp.id] ?? null;

        return (
          <Card
            key={emp.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setExpandedId(expanded ? null : emp.id)}
            onKeyDown={(event: React.KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setExpandedId(expanded ? null : emp.id);
              }
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{emp.fullName}</h2>
                  <Badge tone={emp.status === "active" ? "success" : "neutral"}>
                    {emp.status === "active" ? t.employees.active : t.employees.inactive}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-foreground/55 font-mono">{emp.employeeNumber}</p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.employees.branch}: {branchMap[emp.branchId] ?? emp.branchId}
                </p>
                {emp.user && (
                  <p className="mt-0.5 text-sm text-foreground/45">
                    {t.users.username}: <span className="font-mono">{emp.user.username}</span>
                  </p>
                )}
              </div>
            </div>

            {expanded && (
              <div className="mt-4 grid gap-6 border-t border-line pt-4" onClick={(event) => event.stopPropagation()}>
                {/* Employee details */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                    {t.employees.employeeDetails}
                  </p>

                  <form action={updateEmployeeAction} className="mt-4 grid gap-6">
                    <input type="hidden" name="employeeId" value={emp.id} />
                    <div>
                      <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                        {t.employees.personalInfo}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label htmlFor={`fullName-${emp.id}`} className="text-sm font-medium">
                            {t.employees.fullName} <span className="text-red-500">*</span>
                          </label>
                          <input id={`fullName-${emp.id}`} name="fullName" required defaultValue={emp.fullName} className={inputCls} />
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`idNumber-${emp.id}`} className="text-sm font-medium">{t.employees.idNumber}</label>
                          <input id={`idNumber-${emp.id}`} name="idNumber" defaultValue={emp.idNumber ?? ""} className={inputCls} />
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`phone-${emp.id}`} className="text-sm font-medium">{t.employees.phone}</label>
                          <input id={`phone-${emp.id}`} name="phone" type="tel" defaultValue={emp.phone ?? ""} className={inputCls} />
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`sex-${emp.id}`} className="text-sm font-medium">{t.employees.gender}</label>
                          <select id={`sex-${emp.id}`} name="sex" defaultValue={emp.sex ?? ""} className={inputCls}>
                            <option value="">—</option>
                            <option value="male">{t.employees.male}</option>
                            <option value="female">{t.employees.female}</option>
                          </select>
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`dateOfBirth-${emp.id}`} className="text-sm font-medium">{t.employees.dateOfBirth}</label>
                          <DateInput id={`dateOfBirth-${emp.id}`} name="dateOfBirth" dateFormat={dateFormat} defaultValue={emp.dateOfBirth} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                        {t.employees.employmentInfo}
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label htmlFor={`branchId-${emp.id}`} className="text-sm font-medium">{t.employees.branch}</label>
                          <select id={`branchId-${emp.id}`} name="branchId" defaultValue={emp.branchId} className={inputCls}>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`job-${emp.id}`} className="text-sm font-medium">{t.employees.job}</label>
                          <input id={`job-${emp.id}`} name="job" defaultValue={emp.job ?? ""} className={inputCls} />
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`salary-${emp.id}`} className="text-sm font-medium">{t.employees.salary}</label>
                          <input id={`salary-${emp.id}`} name="salary" type="number" min="0" step="0.01" defaultValue={emp.salary ?? ""} className={inputCls} />
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`workType-${emp.id}`} className="text-sm font-medium">{t.employees.workType}</label>
                          <select id={`workType-${emp.id}`} name="workType" defaultValue={emp.workType ?? ""} className={inputCls}>
                            <option value="">—</option>
                            <option value="fullTime">{t.employees.fullTime}</option>
                            <option value="partTime">{t.employees.partTime}</option>
                            <option value="trainee">{t.employees.trainee}</option>
                          </select>
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`startDate-${emp.id}`} className="text-sm font-medium">{t.employees.startDate}</label>
                          <DateInput id={`startDate-${emp.id}`} name="startDate" dateFormat={dateFormat} defaultValue={emp.startDate} />
                        </div>

                        <div className="grid gap-1.5">
                          <label htmlFor={`endDate-${emp.id}`} className="text-sm font-medium">{t.employees.endDate}</label>
                          <DateInput id={`endDate-${emp.id}`} name="endDate" dateFormat={dateFormat} defaultValue={emp.endDate} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                        {t.classes.coachProfileTitle}
                      </p>
                      <input
                        type="checkbox"
                        id={`isCoach-${emp.id}`}
                        name="isCoach"
                        value="true"
                        defaultChecked={coachProfile !== null}
                        className="peer h-4 w-4 cursor-pointer rounded border-line align-middle accent-brand"
                      />
                      <label htmlFor={`isCoach-${emp.id}`} className="ms-3 cursor-pointer align-middle text-sm">
                        {t.employees.isCoach}
                      </label>
                      <div className="mt-4 hidden gap-4 peer-checked:grid sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label htmlFor={`specializations-${emp.id}`} className="text-sm font-medium">
                            {t.classes.specializations}
                          </label>
                          <input
                            id={`specializations-${emp.id}`}
                            name="specializations"
                            defaultValue={(coachProfile?.specializations ?? []).join(", ")}
                            placeholder="CrossFit, HIIT"
                            className={inputCls}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label htmlFor={`certifications-${emp.id}`} className="text-sm font-medium">
                            {t.classes.certifications}
                          </label>
                          <input
                            id={`certifications-${emp.id}`}
                            name="certifications"
                            defaultValue={(coachProfile?.certifications ?? []).join(", ")}
                            placeholder="CF-L1"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button type="submit" variant="primary" size="sm" icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}>
                        {t.actions.save}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* System access */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
                    {t.employees.systemAccess}
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="text-foreground/55">{t.employees.isUser}</dt>
                      <dd className="mt-0.5 font-medium">{emp.user ? t.plans.yes : t.plans.no}</dd>
                    </div>
                    {emp.user && (
                      <div>
                        <dt className="text-foreground/55">{t.users.username}</dt>
                        <dd className="mt-0.5 font-mono">{emp.user.username}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* System info + status toggle */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">System</p>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div>
                      <dt className="text-foreground/55">{t.employees.employeeNumber}</dt>
                      <dd className="mt-0.5 font-mono">{emp.employeeNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/55">{t.employees.employeeId}</dt>
                      <dd className="mt-0.5 font-mono text-xs text-foreground/70">{emp.id}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/55">{t.employees.status}</dt>
                      <dd className="mt-0.5 font-medium">
                        {emp.status === "active" ? t.employees.active : t.employees.inactive}
                      </dd>
                    </div>
                  </dl>

                  <form action={toggleEmployeeStatusAction} className="mt-5">
                    <input type="hidden" name="employeeId" value={emp.id} />
                    <input type="hidden" name="currentStatus" value={emp.status} />
                    <Button
                      type="submit"
                      variant={emp.status === "active" ? "danger" : "secondary"}
                      size="sm"
                      icon={
                        emp.status === "active" ? (
                          <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        )
                      }
                    >
                      {emp.status === "active" ? t.employees.deactivate : t.employees.reactivate}
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </section>
  );
}
