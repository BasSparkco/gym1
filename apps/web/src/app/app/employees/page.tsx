"use server";

import { listEmployees } from "@/lib/employees";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [employees, branches] = await Promise.all([listEmployees(), listBranches()]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const activeCount = employees.filter((e) => e.status === "active").length;

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.employees.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.employees.title}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {activeCount} active · {employees.length} total in {session.tenant.name}.
          </p>
        </div>
        <Link
          href="/app/employees/new"
          className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          {t.employees.newEmployee}
        </Link>
      </section>

      <section className="grid gap-3">
        {employees.length === 0 && (
          <div className="rounded-[2rem] border border-line bg-surface px-6 py-10 text-center text-sm text-foreground/60">
            {t.employees.noEmployees}
          </div>
        )}
        {employees.map((emp) => (
          <article
            key={emp.id}
            className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{emp.fullName}</h2>
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      emp.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {emp.status === "active" ? t.employees.active : t.employees.inactive}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/55 font-mono">{emp.employeeNumber}</p>
                <p className="mt-0.5 text-sm text-foreground/45">
                  {t.employees.branch}: {branchMap.get(emp.branchId) ?? emp.branchId}
                </p>
              </div>
              <Link
                href={`/app/employees/${emp.id}`}
                className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
              >
                {t.actions.view}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
