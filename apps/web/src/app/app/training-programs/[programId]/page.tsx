"use server";

import { getTrainingProgram, updateTrainingProgram } from "@/lib/training-programs";
import { listClassSessions } from "@/lib/class-sessions";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ programId: string }>;
};

export default async function TrainingProgramDetailPage({ params }: Props) {
  const { programId } = await params;
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager" && session.role !== "front-desk") {
    redirect("/app/dashboard");
  }

  const canManage = session.role === "owner" || session.role === "manager";

  const [program, sessions, branches, coaches] = await Promise.all([
    getTrainingProgram(programId),
    listClassSessions({ programId }),
    listBranches(),
    listCoaches(),
  ]);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const coachMap = new Map(coaches.map((c) => [c.id, c.fullName]));

  async function handleUpdate(formData: FormData) {
    "use server";
    const branchId = (formData.get("branchId") as string) || null;
    const maxMembersRaw = formData.get("maxMembers") as string;
    const defaultCoachId = (formData.get("defaultCoachId") as string) || null;
    await updateTrainingProgram(programId, {
      name: formData.get("name") as string,
      branchId,
      description: (formData.get("description") as string) || undefined,
      color: (formData.get("color") as string) || undefined,
      maxMembers: maxMembersRaw ? Number(maxMembersRaw) : undefined,
      defaultCoachId,
      active: formData.get("active") === "true",
    });
    redirect(`/app/training-programs/${programId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  const upcoming = sessions
    .filter((s) => s.status !== "cancelled")
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.classes.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{program.name}</h1>
        </div>
        <Link
          href="/app/training-programs"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.classes.allPrograms}
        </Link>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.classes.programDetails}
        </p>

        {canManage ? (
          <form action={handleUpdate} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <label htmlFor="name" className="text-sm font-medium">{t.classes.programName}</label>
              <input id="name" name="name" required defaultValue={program.name} className={inputCls} />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <label htmlFor="description" className="text-sm font-medium">{t.classes.description}</label>
              <textarea id="description" name="description" rows={3} defaultValue={program.description ?? ""} className={inputCls} />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="branchId" className="text-sm font-medium">{t.employees.branch}</label>
              <select id="branchId" name="branchId" defaultValue={program.branchId ?? ""} className={selectCls}>
                <option value="">{t.classes.allBranches}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="defaultCoachId" className="text-sm font-medium">{t.classes.defaultCoach}</label>
              <select id="defaultCoachId" name="defaultCoachId" defaultValue={program.defaultCoachId ?? ""} className={selectCls}>
                <option value="">{t.classes.noCoach}</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>{coach.fullName}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="maxMembers" className="text-sm font-medium">{t.classes.maxMembers}</label>
              <input id="maxMembers" name="maxMembers" type="number" min="1" defaultValue={program.maxMembers ?? ""} className={inputCls} />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="active" className="text-sm font-medium">{t.status.active}</label>
              <select id="active" name="active" defaultValue={String(program.active)} className={selectCls}>
                <option value="true">{t.status.active}</option>
                <option value="false">{t.status.inactive}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2 sm:col-span-2">
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
              <dt className="text-foreground/55">{t.employees.branch}</dt>
              <dd className="mt-0.5 font-medium">
                {program.branchId ? (branchMap.get(program.branchId) ?? program.branchId) : t.classes.allBranches}
              </dd>
            </div>
            {program.defaultCoachId && (
              <div>
                <dt className="text-foreground/55">{t.classes.defaultCoach}</dt>
                <dd className="mt-0.5 font-medium">{coachMap.get(program.defaultCoachId) ?? program.defaultCoachId}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.classes.sessionsTitle}
          </p>
          {canManage && (
            <Link
              href={`/app/training-programs/${programId}/sessions/new`}
              className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.classes.newSession}
            </Link>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-foreground/60">{t.classes.noSessions}</p>
          )}
          {upcoming.map((s) => (
            <article
              key={s.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {s.date} · {s.startTime.slice(11, 16)}–{s.endTime.slice(11, 16)}
                </p>
                <p className="mt-0.5 text-sm text-foreground/55">
                  {branchMap.get(s.branchId) ?? s.branchId}
                  {s.room ? ` · ${s.room}` : ""}
                  {s.coachId ? ` · ${coachMap.get(s.coachId) ?? s.coachId}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium">
                  {s.bookedCount}/{s.capacity} {t.classes.bookedCount.toLowerCase()}
                </span>
                <Link
                  href={`/app/training-programs/${programId}/sessions/${s.id}`}
                  className="shrink-0 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
                >
                  {t.classes.viewSession}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
