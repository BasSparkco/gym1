"use server";

import {
  getEmployee,
  updateEmployee,
  getCoachProfile,
  upsertCoachProfile,
  removeCoachProfile,
} from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import DateInput from "@/components/date-input";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneNumber } from "@/components/phone-number";
import { Save, Ban, CheckCircle2 } from "lucide-react";

type Props = {
  params: Promise<{ employeeId: string }>;
};

export default async function EmployeeDetailPage({ params }: Props) {
  const { employeeId } = await params;
  const session = await requireSession();
  const t = await getT();

  const [employee, branches, settings, coachProfile] = await Promise.all([
    getEmployee(employeeId),
    listBranches(),
    getSettings(),
    getCoachProfile(employeeId),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const employeeBranch = branches.find((b) => b.id === employee.branchId);
  const currencySymbol = getCurrencySymbol(employeeBranch?.operatingCurrencyCode);
  const canEdit = session.role === "owner" || session.role === "manager";

  async function handleUpdate(formData: FormData) {
    "use server";
    const salaryRaw = formData.get("salary") as string;
    await updateEmployee(employeeId, {
      fullName: formData.get("fullName") as string,
      branchId: formData.get("branchId") as string,
      idNumber: (formData.get("idNumber") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      sex: (formData.get("sex") as "male" | "female") || undefined,
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      job: (formData.get("job") as string) || undefined,
      salary: salaryRaw ? Number(salaryRaw) : undefined,
      workType: (formData.get("workType") as "fullTime" | "partTime" | "trainee") || undefined,
      startDate: (formData.get("startDate") as string) || undefined,
      endDate: (formData.get("endDate") as string) || undefined,
    });

    const isCoach = formData.get("isCoach") === "true";
    if (isCoach) {
      const specializations = ((formData.get("specializations") as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const certifications = ((formData.get("certifications") as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await upsertCoachProfile(employeeId, { specializations, certifications });
    } else if (coachProfile) {
      await removeCoachProfile(employeeId);
    }

    redirect(`/app/employees/${employeeId}`);
  }

  async function handleToggleStatus() {
    "use server";
    await updateEmployee(employeeId, {
      status: employee.status === "active" ? "inactive" : "active",
    });
    redirect(`/app/employees/${employeeId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  const workTypeLabel = {
    fullTime: t.employees.fullTime,
    partTime: t.employees.partTime,
    trainee: t.employees.trainee,
  } as Record<string, string>;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.employees.title}
        title={
          <span className="flex items-center gap-3">
            {employee.fullName}
            <Badge tone={employee.status === "active" ? "success" : "neutral"}>
              {employee.status === "active" ? t.employees.active : t.employees.inactive}
            </Badge>
          </span>
        }
        description={<span className="font-mono">{employee.employeeNumber}</span>}
        actions={
          <Button href="/app/employees" variant="secondary">
            {t.employees.allEmployees}
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* ── Personal & Employment details ── */}
        <Card animate delay={1}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.employees.employeeDetails}
          </p>

          {canEdit ? (
            <form action={handleUpdate} className="mt-4 grid gap-6">
              {/* Personal info */}
              <div>
                <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                  {t.employees.personalInfo}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="fullName" className="text-sm font-medium">{t.employees.fullName} <span className="text-red-500">*</span></label>
                    <input id="fullName" name="fullName" required defaultValue={employee.fullName} className={inputCls} />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="idNumber" className="text-sm font-medium">{t.employees.idNumber}</label>
                    <input id="idNumber" name="idNumber" defaultValue={employee.idNumber ?? ""} className={inputCls} />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="phone" className="text-sm font-medium">{t.employees.phone}</label>
                    <input id="phone" name="phone" type="tel" defaultValue={employee.phone ?? ""} className={inputCls} />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="sex" className="text-sm font-medium">{t.employees.gender}</label>
                    <select id="sex" name="sex" defaultValue={employee.sex ?? ""} className={selectCls}>
                      <option value="">—</option>
                      <option value="male">{t.employees.male}</option>
                      <option value="female">{t.employees.female}</option>
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="dateOfBirth" className="text-sm font-medium">{t.employees.dateOfBirth}</label>
                    <DateInput id="dateOfBirth" name="dateOfBirth" dateFormat={dateFormat} defaultValue={employee.dateOfBirth} />
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
                    <label htmlFor="branchId" className="text-sm font-medium">{t.employees.branch}</label>
                    <select id="branchId" name="branchId" defaultValue={employee.branchId} className={selectCls}>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="job" className="text-sm font-medium">{t.employees.job}</label>
                    <input id="job" name="job" defaultValue={employee.job ?? ""} className={inputCls} />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="salary" className="text-sm font-medium">{t.employees.salary}</label>
                    <input id="salary" name="salary" type="number" min="0" step="0.01" defaultValue={employee.salary ?? ""} className={inputCls} />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="workType" className="text-sm font-medium">{t.employees.workType}</label>
                    <select id="workType" name="workType" defaultValue={employee.workType ?? ""} className={selectCls}>
                      <option value="">—</option>
                      <option value="fullTime">{t.employees.fullTime}</option>
                      <option value="partTime">{t.employees.partTime}</option>
                      <option value="trainee">{t.employees.trainee}</option>
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="startDate" className="text-sm font-medium">{t.employees.startDate}</label>
                    <DateInput id="startDate" name="startDate" dateFormat={dateFormat} defaultValue={employee.startDate} />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="endDate" className="text-sm font-medium">{t.employees.endDate}</label>
                    <DateInput id="endDate" name="endDate" dateFormat={dateFormat} defaultValue={employee.endDate} />
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
                  id="isCoach"
                  name="isCoach"
                  value="true"
                  defaultChecked={coachProfile !== null}
                  className="peer h-4 w-4 cursor-pointer rounded border-line align-middle accent-brand"
                />
                <label htmlFor="isCoach" className="ms-3 cursor-pointer align-middle text-sm">
                  {t.employees.isCoach}
                </label>
                <div className="mt-4 hidden gap-4 peer-checked:grid sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="specializations" className="text-sm font-medium">
                      {t.classes.specializations}
                    </label>
                    <input
                      id="specializations"
                      name="specializations"
                      defaultValue={(coachProfile?.specializations ?? []).join(", ")}
                      placeholder="CrossFit, HIIT"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="certifications" className="text-sm font-medium">
                      {t.classes.certifications}
                    </label>
                    <input
                      id="certifications"
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
                  {branchMap.get(employee.branchId) ?? employee.branchId}
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
        </Card>

        {/* ── System access (read-only; account creation happens on the Users page) ── */}
        <Card animate delay={2}>
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
                <dt className="text-foreground/55">{t.users.username}</dt>
                <dd className="mt-0.5 font-mono">{employee.user.username}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* ── Coach profile (read-only; editing happens in the form above) ── */}
        {!canEdit && (
          <Card animate delay={3}>
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
          </Card>
        )}

        {/* ── System info + status toggle ── */}
        <Card animate delay={canEdit ? 3 : 4}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">System</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-foreground/55">{t.employees.employeeNumber}</dt>
              <dd className="mt-0.5 font-mono">{employee.employeeNumber}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.employees.employeeId}</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground/70">{employee.id}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">{t.employees.status}</dt>
              <dd className="mt-0.5 font-medium">
                {employee.status === "active" ? t.employees.active : t.employees.inactive}
              </dd>
            </div>
          </dl>

          {canEdit && (
            <form action={handleToggleStatus} className="mt-5">
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
          )}
        </Card>
      </div>
    </div>
  );
}
