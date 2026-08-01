"use client";

import DateInput from "@/components/date-input";
import { Button } from "@/components/ui/button";
import { PhoneNumber } from "@/components/phone-number";
import type { Employee, CoachProfile } from "@/lib/employees";
import type { Branch } from "@/lib/branches";
import type { Gate } from "@/lib/gates";
import type { EmployeeGateAccess, EmployeeVisit } from "@/lib/employee-attendance";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { Save, Ban, CheckCircle2, QrCode } from "lucide-react";

// The single canonical layout an employee profile is rendered from. Both the
// dedicated /app/employees/[employeeId] page and the employees-list inline
// expansion (EmployeeList) render their fetched data through this component
// and submit through the same server actions, so the two never drift apart.

const inputCls =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const cardCls =
  "rounded-[18px] border border-line bg-surface px-6 py-5 shadow-[0_16px_32px_-24px_rgba(var(--shadow-tint),0.55)]";

type Props = {
  employee: Employee;
  coachProfile: CoachProfile | null;
  branches: Branch[];
  branchMap: Record<string, string>;
  dateFormat: DateFormat;
  currencySymbol: string;
  canEdit: boolean;
  t: Dict;
  updateAction: (formData: FormData) => void | Promise<void>;
  toggleStatusAction: (formData: FormData) => void | Promise<void>;
  gates?: Gate[];
  gateAccess?: EmployeeGateAccess;
  setGatesAction?: (formData: FormData) => void | Promise<void>;
  recentVisits?: EmployeeVisit[];
};

export function EmployeeProfileView({
  employee,
  coachProfile,
  branches,
  branchMap,
  dateFormat,
  currencySymbol,
  canEdit,
  t,
  updateAction,
  toggleStatusAction,
  gates,
  gateAccess,
  setGatesAction,
  recentVisits,
}: Props) {
  const formId = `employee-form-${employee.id}`;
  const fid = (name: string) => `${name}-${employee.id}`;

  const workTypeLabel = {
    fullTime: t.employees.fullTime,
    partTime: t.employees.partTime,
    trainee: t.employees.trainee,
  } as Record<string, string>;

  return (
    <div className="grid gap-6">
      {/* Employee details */}
      <div className={`${cardCls} border-s-4 border-s-brand`}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.employees.employeeDetails}
        </p>

        {canEdit ? (
          <form id={formId} action={updateAction} className="mt-4 grid gap-6">
            <input type="hidden" name="employeeId" value={employee.id} />
            {/* Personal info */}
            <div>
              <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                {t.employees.personalInfo}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={fid("fullName")} className="text-sm font-medium">
                    {t.employees.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input id={fid("fullName")} name="fullName" required defaultValue={employee.fullName} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("idNumber")} className="text-sm font-medium">{t.employees.idNumber}</label>
                  <input id={fid("idNumber")} name="idNumber" defaultValue={employee.idNumber ?? ""} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("phone")} className="text-sm font-medium">{t.employees.phone}</label>
                  <input id={fid("phone")} name="phone" type="tel" defaultValue={employee.phone ?? ""} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("sex")} className="text-sm font-medium">{t.employees.gender}</label>
                  <select id={fid("sex")} name="sex" defaultValue={employee.sex ?? ""} className={inputCls}>
                    <option value="">—</option>
                    <option value="male">{t.employees.male}</option>
                    <option value="female">{t.employees.female}</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("dateOfBirth")} className="text-sm font-medium">{t.employees.dateOfBirth}</label>
                  <DateInput id={fid("dateOfBirth")} name="dateOfBirth" dateFormat={dateFormat} defaultValue={employee.dateOfBirth} />
                </div>
              </div>
            </div>

            {/* Employment info */}
            <div>
              <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                {t.employees.employmentInfo}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={fid("branchId")} className="text-sm font-medium">{t.employees.branch}</label>
                  <select id={fid("branchId")} name="branchId" defaultValue={employee.branchId} className={inputCls}>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("job")} className="text-sm font-medium">{t.employees.job}</label>
                  <input id={fid("job")} name="job" defaultValue={employee.job ?? ""} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("salary")} className="text-sm font-medium">{t.employees.salary}</label>
                  <input id={fid("salary")} name="salary" type="number" min="0" step="0.01" defaultValue={employee.salary ?? ""} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("workType")} className="text-sm font-medium">{t.employees.workType}</label>
                  <select id={fid("workType")} name="workType" defaultValue={employee.workType ?? ""} className={inputCls}>
                    <option value="">—</option>
                    <option value="fullTime">{t.employees.fullTime}</option>
                    <option value="partTime">{t.employees.partTime}</option>
                    <option value="trainee">{t.employees.trainee}</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("startDate")} className="text-sm font-medium">{t.employees.startDate}</label>
                  <DateInput id={fid("startDate")} name="startDate" dateFormat={dateFormat} defaultValue={employee.startDate} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("endDate")} className="text-sm font-medium">{t.employees.endDate}</label>
                  <DateInput id={fid("endDate")} name="endDate" dateFormat={dateFormat} defaultValue={employee.endDate} />
                </div>
              </div>
            </div>

            {/* Coach profile (revealed via peer-checked, no client JS) */}
            <div>
              <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                {t.classes.coachProfileTitle}
              </p>
              <input
                type="checkbox"
                id={fid("isCoach")}
                name="isCoach"
                value="true"
                defaultChecked={coachProfile !== null}
                className="peer h-4 w-4 cursor-pointer rounded border-line align-middle accent-brand"
              />
              <label htmlFor={fid("isCoach")} className="ms-3 cursor-pointer align-middle text-sm">
                {t.employees.isCoach}
              </label>
              <div className="mt-4 hidden gap-4 peer-checked:grid sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={fid("specializations")} className="text-sm font-medium">
                    {t.classes.specializations}
                  </label>
                  <input
                    id={fid("specializations")}
                    name="specializations"
                    defaultValue={(coachProfile?.specializations ?? []).join(", ")}
                    placeholder="CrossFit, HIIT"
                    className={inputCls}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={fid("certifications")} className="text-sm font-medium">
                    {t.classes.certifications}
                  </label>
                  <input
                    id={fid("certifications")}
                    name="certifications"
                    defaultValue={(coachProfile?.certifications ?? []).join(", ")}
                    placeholder="CF-L1"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </form>
        ) : (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-foreground/55">{t.employees.fullName}</dt>
              <dd className="mt-0.5 font-medium">{employee.fullName}</dd>
            </div>
            {employee.idNumber && (
              <div>
                <dt className="text-foreground/55">{t.employees.idNumber}</dt>
                <dd className="mt-0.5 font-medium">{employee.idNumber}</dd>
              </div>
            )}
            {employee.phone && (
              <div>
                <dt className="text-foreground/55">{t.employees.phone}</dt>
                <dd className="mt-0.5 font-medium">
                  <PhoneNumber value={employee.phone} />
                </dd>
              </div>
            )}
            {employee.sex && (
              <div>
                <dt className="text-foreground/55">{t.employees.gender}</dt>
                <dd className="mt-0.5 font-medium">
                  {employee.sex === "male" ? t.employees.male : t.employees.female}
                </dd>
              </div>
            )}
            {employee.dateOfBirth && (
              <div>
                <dt className="text-foreground/55">{t.employees.dateOfBirth}</dt>
                <dd className="mt-0.5 font-medium">{employee.dateOfBirth}</dd>
              </div>
            )}
            <div>
              <dt className="text-foreground/55">{t.employees.branch}</dt>
              <dd className="mt-0.5 font-medium">
                {branchMap[employee.branchId] ?? employee.branchId}
              </dd>
            </div>
            {employee.job && (
              <div>
                <dt className="text-foreground/55">{t.employees.job}</dt>
                <dd className="mt-0.5 font-medium">{employee.job}</dd>
              </div>
            )}
            {employee.salary !== undefined && (
              <div>
                <dt className="text-foreground/55">{t.employees.salary}</dt>
                <dd className="mt-0.5 font-medium">{currencySymbol}{employee.salary}</dd>
              </div>
            )}
            {employee.workType && (
              <div>
                <dt className="text-foreground/55">{t.employees.workType}</dt>
                <dd className="mt-0.5 font-medium">{workTypeLabel[employee.workType] ?? employee.workType}</dd>
              </div>
            )}
            {employee.startDate && (
              <div>
                <dt className="text-foreground/55">{t.employees.startDate}</dt>
                <dd className="mt-0.5 font-medium">{employee.startDate}</dd>
              </div>
            )}
            {employee.endDate && (
              <div>
                <dt className="text-foreground/55">{t.employees.endDate}</dt>
                <dd className="mt-0.5 font-medium">{employee.endDate}</dd>
              </div>
            )}
          </dl>
        )}

        {canEdit && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" form={formId} variant="primary" size="sm" icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}>
              {t.actions.save}
            </Button>

            <form action={toggleStatusAction}>
              <input type="hidden" name="employeeId" value={employee.id} />
              <input type="hidden" name="currentStatus" value={employee.status} />
              <Button
                type="submit"
                variant={employee.status === "active" ? "danger" : "secondary"}
                size="sm"
                icon={
                  employee.status === "active" ? (
                    <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                  )
                }
              >
                {employee.status === "active" ? t.employees.deactivate : t.employees.reactivate}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* System access (read-only; account creation happens on the Users page) */}
      <div className={`${cardCls} border-s-4 border-s-blue-500`}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.employees.systemAccess}
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-foreground/55">{t.employees.isUser}</dt>
            <dd className="mt-0.5 font-medium">{employee.user ? t.plans.yes : t.plans.no}</dd>
          </div>
          {employee.user && (
            <div>
              <dt className="text-foreground/55">{t.users.email}</dt>
              <dd className="mt-0.5 font-mono">{employee.user.email}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Coach profile (read-only; editing happens in the form above) */}
      {!canEdit && (
        <div className={`${cardCls} border-s-4 border-s-accent-strong`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.classes.coachProfileTitle}
          </p>
          {coachProfile ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-foreground/55">{t.classes.specializations}</dt>
                <dd className="mt-0.5 font-medium">{coachProfile.specializations.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt className="text-foreground/55">{t.classes.certifications}</dt>
                <dd className="mt-0.5 font-medium">{coachProfile.certifications.join(", ") || "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-foreground/60">{t.classes.notACoach}</p>
          )}
        </div>
      )}

      {/* Gate access + QR code */}
      {gates !== undefined && gateAccess !== undefined && (
        <div className={`${cardCls} border-s-4 border-s-purple-500`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.attendance.gateAccess}
          </p>

          {canEdit && setGatesAction ? (
            <form action={setGatesAction} className="mt-4 grid gap-4">
              <input type="hidden" name="employeeId" value={employee.id} />
              <select
                name="allowAllGates"
                defaultValue={gateAccess.allowAllGates ? "true" : "false"}
                className={inputCls}
              >
                <option value="true">{t.attendance.allGates}</option>
                <option value="false">{t.attendance.selectedGatesOnly}</option>
              </select>
              {gates.length === 0 ? (
                <p className="text-sm text-foreground/55">{t.attendance.noGatesYet}</p>
              ) : (
                <div className="grid gap-2 rounded-2xl border border-line bg-white px-4 py-3 sm:grid-cols-2">
                  {gates.map((gate) => (
                    <label key={gate.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="gateIds"
                        value={gate.id}
                        defaultChecked={gateAccess.gateIds.includes(gate.id)}
                        className="h-4 w-4 rounded border-line accent-brand"
                      />
                      <span>{gate.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <Button type="submit" variant="secondary" size="sm" className="w-fit" icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}>
                {t.actions.save}
              </Button>
            </form>
          ) : (
            <p className="mt-3 text-sm">
              {gateAccess.allowAllGates
                ? t.attendance.allGates
                : `${t.attendance.selectedGatesOnly}: ${
                    gates
                      .filter((g) => gateAccess.gateIds.includes(g.id))
                      .map((g) => g.name)
                      .join(", ") || "—"
                  }`}
            </p>
          )}

          <div className="mt-5 border-t border-line pt-4">
            <Button
              href={`/app/employees/${employee.id}/qr`}
              variant="secondary"
              size="sm"
              icon={<QrCode className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              {t.attendance.qrCode}
            </Button>
          </div>
        </div>
      )}

      {/* Recent attendance */}
      {recentVisits !== undefined && (
        <div className={`${cardCls} border-s-4 border-s-green-500`}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.attendance.recentAttendance}
          </p>
          {recentVisits.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/55">{t.attendance.noRecentAttendance}</p>
          ) : (
            <ul className="mt-4 grid gap-2 text-sm">
              {recentVisits.map((visit) => (
                <li
                  key={visit.id}
                  className="flex items-center justify-between rounded-xl border border-line px-3 py-2"
                >
                  <span>{new Date(visit.checkInTime).toLocaleString()}</span>
                  <span className="text-foreground/60">
                    {visit.checkOutTime
                      ? new Date(visit.checkOutTime).toLocaleString()
                      : t.attendance.stillCheckedIn}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
