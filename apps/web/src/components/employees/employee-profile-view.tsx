"use client";

import { startTransition, useMemo, useState, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";
import DateInput from "@/components/date-input";
import { Button } from "@/components/ui/button";
import { PhoneNumber } from "@/components/phone-number";
import type { Employee, CoachProfile } from "@/lib/employees";
import type { Branch } from "@/lib/branches";
import type { Gate } from "@/lib/gates";
import type { EmployeeGateAccess, EmployeeVisit } from "@/lib/employee-attendance";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { GateAccessScopeField } from "@/components/employees/gate-access-scope-field";
import { Save, Ban, CheckCircle2, QrCode, Loader2 } from "lucide-react";

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

// All editable fields, tracked as strings/booleans (matching how every
// input/select/checkbox exposes its value) so a plain shallow diff against
// the last-saved snapshot is enough to know whether the form is dirty — no
// schema/validation library needed just to answer "did anything change".
type FormValues = {
  fullName: string;
  idNumber: string;
  phone: string;
  sex: string;
  dateOfBirth: string;
  branchId: string;
  job: string;
  salary: string;
  workType: string;
  startDate: string;
  endDate: string;
  isCoach: boolean;
  specializations: string;
  certifications: string;
};

function toFormValues(employee: Employee, coachProfile: CoachProfile | null): FormValues {
  return {
    fullName: employee.fullName ?? "",
    idNumber: employee.idNumber ?? "",
    phone: employee.phone ?? "",
    sex: employee.sex ?? "",
    dateOfBirth: employee.dateOfBirth ?? "",
    branchId: employee.branchId ?? "",
    job: employee.job ?? "",
    salary: employee.salary != null ? String(employee.salary) : "",
    workType: employee.workType ?? "",
    startDate: employee.startDate ?? "",
    endDate: employee.endDate ?? "",
    isCoach: coachProfile !== null,
    specializations: (coachProfile?.specializations ?? []).join(", "),
    certifications: (coachProfile?.certifications ?? []).join(", "),
  };
}

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

  // `initialValues` is the last-known-saved snapshot — the baseline the Save
  // button's dirty check compares against. It starts from the employee/coach
  // props and is replaced with `values` on every successful save, so "dirty"
  // always means "differs from what's actually on the server", not from page
  // load.
  const [initialValues, setInitialValues] = useState<FormValues>(() => toFormValues(employee, coachProfile));
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => (Object.keys(initialValues) as (keyof FormValues)[]).some((key) => values[key] !== initialValues[key]),
    [values, initialValues],
  );

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (saveError) setSaveError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || isSaving) return;

    // Server Actions need to run inside a transition for Next.js to apply
    // their revalidatePath()-triggered refresh as a scoped patch rather than
    // a full route reset, matching the pattern used by MemberEditForm.
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setSaveError(null);
    startTransition(async () => {
      try {
        await updateAction(formData);
        setInitialValues(values);
      } catch (err) {
        unstable_rethrow(err);
        setSaveError(t.employees.saveError);
      } finally {
        setIsSaving(false);
      }
    });
  }

  return (
    <div className="grid gap-6">
      {/* Employee details */}
      <div className={`${cardCls} border-s-4 border-s-brand`}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.employees.employeeDetails}
        </p>

        {canEdit ? (
          <form id={formId} onSubmit={handleSubmit} className="mt-4 grid gap-6">
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
                  <input
                    id={fid("fullName")}
                    name="fullName"
                    required
                    value={values.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("idNumber")} className="text-sm font-medium">{t.employees.idNumber}</label>
                  <input
                    id={fid("idNumber")}
                    name="idNumber"
                    value={values.idNumber}
                    onChange={(event) => updateField("idNumber", event.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("phone")} className="text-sm font-medium">{t.employees.phone}</label>
                  <input
                    id={fid("phone")}
                    name="phone"
                    type="tel"
                    value={values.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("sex")} className="text-sm font-medium">{t.employees.gender}</label>
                  <select
                    id={fid("sex")}
                    name="sex"
                    value={values.sex}
                    onChange={(event) => updateField("sex", event.target.value)}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    <option value="male">{t.employees.male}</option>
                    <option value="female">{t.employees.female}</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("dateOfBirth")} className="text-sm font-medium">{t.employees.dateOfBirth}</label>
                  <DateInput
                    id={fid("dateOfBirth")}
                    name="dateOfBirth"
                    dateFormat={dateFormat}
                    defaultValue={employee.dateOfBirth}
                    onChange={(value) => updateField("dateOfBirth", value)}
                  />
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
                  <select
                    id={fid("branchId")}
                    name="branchId"
                    value={values.branchId}
                    onChange={(event) => updateField("branchId", event.target.value)}
                    className={inputCls}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("job")} className="text-sm font-medium">{t.employees.job}</label>
                  <input
                    id={fid("job")}
                    name="job"
                    value={values.job}
                    onChange={(event) => updateField("job", event.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("salary")} className="text-sm font-medium">{t.employees.salary}</label>
                  <input
                    id={fid("salary")}
                    name="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.salary}
                    onChange={(event) => updateField("salary", event.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("workType")} className="text-sm font-medium">{t.employees.workType}</label>
                  <select
                    id={fid("workType")}
                    name="workType"
                    value={values.workType}
                    onChange={(event) => updateField("workType", event.target.value)}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    <option value="fullTime">{t.employees.fullTime}</option>
                    <option value="partTime">{t.employees.partTime}</option>
                    <option value="trainee">{t.employees.trainee}</option>
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("startDate")} className="text-sm font-medium">{t.employees.startDate}</label>
                  <DateInput
                    id={fid("startDate")}
                    name="startDate"
                    dateFormat={dateFormat}
                    defaultValue={employee.startDate}
                    onChange={(value) => updateField("startDate", value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={fid("endDate")} className="text-sm font-medium">{t.employees.endDate}</label>
                  <DateInput
                    id={fid("endDate")}
                    name="endDate"
                    dateFormat={dateFormat}
                    defaultValue={employee.endDate}
                    onChange={(value) => updateField("endDate", value)}
                  />
                </div>
              </div>
            </div>

            {/* Coach profile (revealed via peer-checked, no extra JS needed
                since the checkbox's `checked` state already drives the CSS) */}
            <div>
              <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                {t.classes.coachProfileTitle}
              </p>
              <input
                type="checkbox"
                id={fid("isCoach")}
                name="isCoach"
                value="true"
                checked={values.isCoach}
                onChange={(event) => updateField("isCoach", event.target.checked)}
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
                    value={values.specializations}
                    onChange={(event) => updateField("specializations", event.target.value)}
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
                    value={values.certifications}
                    onChange={(event) => updateField("certifications", event.target.value)}
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
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                form={formId}
                variant="primary"
                size="sm"
                disabled={!isDirty || isSaving}
                icon={
                  isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    <Save className="h-3.5 w-3.5" strokeWidth={2} />
                  )
                }
              >
                {isSaving ? t.actions.saving : t.actions.save}
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
            {saveError && <p className="text-sm text-danger">{saveError}</p>}
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
              <GateAccessScopeField
                gates={gates}
                branchMap={branchMap}
                defaultScope={gateAccess.gateAccessScope}
                defaultGateIds={gateAccess.gateIds}
                t={t}
              />
              <Button type="submit" variant="secondary" size="sm" className="w-fit" icon={<Save className="h-3.5 w-3.5" strokeWidth={2} />}>
                {t.actions.save}
              </Button>
            </form>
          ) : (
            <p className="mt-3 text-sm">
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
