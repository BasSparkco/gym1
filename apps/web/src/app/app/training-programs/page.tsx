"use server";

import { listTrainingPrograms } from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TrainingProgramsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager" && session.role !== "front-desk") {
    redirect("/app/dashboard");
  }

  const canManage = session.role === "owner" || session.role === "manager";

  const [programs, branches, coaches] = await Promise.all([
    listTrainingPrograms(),
    listBranches(),
    listCoaches(),
  ]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const coachMap = new Map(coaches.map((c) => [c.id, c.fullName]));

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.classes.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.classes.programsTitle}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {programs.length} {t.classes.programsTitle.toLowerCase()} in {session.tenant.name}.
          </p>
        </div>
        {canManage && (
          <Link
            href="/app/training-programs/new"
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.classes.newProgram}
          </Link>
        )}
      </section>

      <section className="grid gap-3">
        {programs.length === 0 && (
          <div className="rounded-[2rem] border border-line bg-surface px-6 py-10 text-center text-sm text-foreground/60">
            {t.classes.noPrograms}
          </div>
        )}
        {programs.map((program) => (
          <article
            key={program.id}
            className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{program.name}</h2>
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      program.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {program.active ? t.status.active : t.status.inactive}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/45">
                  {program.branchId
                    ? (branchMap.get(program.branchId) ?? program.branchId)
                    : t.classes.allBranches}
                </p>
                {program.defaultCoachId && (
                  <p className="mt-0.5 text-sm text-foreground/45">
                    {t.classes.coach}: {coachMap.get(program.defaultCoachId) ?? program.defaultCoachId}
                  </p>
                )}
              </div>
              <Link
                href={`/app/training-programs/${program.id}`}
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
