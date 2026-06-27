"use server";

import { createEmployee } from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import DateInput from "@/components/date-input";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewEmployeePage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [branches, settings] = await Promise.all([listBranches(), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  async function handleCreate(formData: FormData) {
    "use server";
    const branchId = (formData.get("branchId") as string) || session.branch.id;
    const salaryRaw = formData.get("salary") as string;
    const employee = await createEmployee({
      fullName: formData.get("fullName") as string,
      branchId,
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
    redirect(`/app/employees/${employee.id}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.employees.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.employees.newStaffEmployee}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          {t.employees.fullName} {t.employees.andBranch}
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-6">

          {/* ── Personal info ── */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              {t.employees.personalInfo}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="fullName" className="text-sm font-medium">
                  {t.employees.fullName} <span className="text-red-500">*</span>
                </label>
                <input id="fullName" name="fullName" required placeholder="e.g. Ahmed Khalil" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="idNumber" className="text-sm font-medium">{t.employees.idNumber}</label>
                <input id="idNumber" name="idNumber" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium">{t.employees.phone}</label>
                <input id="phone" name="phone" type="tel" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="sex" className="text-sm font-medium">{t.employees.gender}</label>
                <select id="sex" name="sex" className={selectCls}>
                  <option value="">—</option>
                  <option value="male">{t.employees.male}</option>
                  <option value="female">{t.employees.female}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">{t.employees.dateOfBirth}</label>
                <DateInput id="dateOfBirth" name="dateOfBirth" dateFormat={dateFormat} />
              </div>
            </div>
          </div>

          {/* ── Employment info ── */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              {t.employees.employmentInfo}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="branchId" className="text-sm font-medium">
                  {t.employees.branch}
                </label>
                <select id="branchId" name="branchId" defaultValue={session.branch.id} className={selectCls}>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="job" className="text-sm font-medium">{t.employees.job}</label>
                <input id="job" name="job" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="salary" className="text-sm font-medium">{t.employees.salary}</label>
                <input id="salary" name="salary" type="number" min="0" step="0.01" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="workType" className="text-sm font-medium">{t.employees.workType}</label>
                <select id="workType" name="workType" className={selectCls}>
                  <option value="">—</option>
                  <option value="fullTime">{t.employees.fullTime}</option>
                  <option value="partTime">{t.employees.partTime}</option>
                  <option value="trainee">{t.employees.trainee}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="startDate" className="text-sm font-medium">{t.employees.startDate}</label>
                <DateInput id="startDate" name="startDate" dateFormat={dateFormat} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="endDate" className="text-sm font-medium">{t.employees.endDate}</label>
                <DateInput id="endDate" name="endDate" dateFormat={dateFormat} />
              </div>
            </div>
          </div>

          {/* ── System access ── */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              {t.employees.systemAccess}
            </p>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="hidden" name="isUser" value="false" />
              <input
                type="checkbox"
                name="isUser"
                value="true"
                className="h-4 w-4 rounded border-line accent-brand"
              />
              <span className="text-sm">{t.employees.isUser}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.employees.createEmployee}
            </button>
            <Link
              href="/app/employees"
              className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {t.actions.cancel}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
