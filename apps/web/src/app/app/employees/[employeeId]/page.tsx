"use server";

import { getEmployee, updateEmployee } from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import DateInput from "@/components/date-input";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ employeeId: string }>;
};

export default async function EmployeeDetailPage({ params }: Props) {
  const { employeeId } = await params;
  const session = await requireSession();
  const t = await getT();

  const [employee, branches, settings] = await Promise.all([
    getEmployee(employeeId),
    listBranches(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
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
      isUser: formData.get("isUser") === "true",
    });
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
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.employees.title}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{employee.fullName}</h1>
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                employee.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {employee.status === "active" ? t.employees.active : t.employees.inactive}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-foreground/60">{employee.employeeNumber}</p>
        </div>
        <Link
          href="/app/employees"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.employees.allEmployees}
        </Link>
      </section>

      <div className="grid gap-6">
        {/* ── Personal & Employment details ── */}
        <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
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

              {/* System access */}
              <div>
                <p className="mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
                  {t.employees.systemAccess}
                </p>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="hidden" name="isUser" value="false" />
                  <input
                    type="checkbox"
                    name="isUser"
                    value="true"
                    defaultChecked={employee.isUser === true}
                    className="h-4 w-4 rounded border-line accent-brand"
                  />
                  <span className="text-sm">{t.employees.isUser}</span>
                </label>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
                >
                  {t.actions.save}
                </button>
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
                  <dd className="mt-0.5 font-medium">{employee.phone}</dd>
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
                  <dd className="mt-0.5 font-medium">{employee.salary}</dd>
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
              <div>
                <dt className="text-foreground/55">{t.employees.isUser}</dt>
                <dd className="mt-0.5 font-medium">{employee.isUser ? t.plans.yes : t.plans.no}</dd>
              </div>
            </dl>
          )}
        </section>

        {/* ── System info + status toggle ── */}
        <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
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
              <button
                type="submit"
                className={[
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  employee.status === "active"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-700 hover:bg-green-50",
                ].join(" ")}
              >
                {employee.status === "active" ? t.employees.deactivate : t.employees.reactivate}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
