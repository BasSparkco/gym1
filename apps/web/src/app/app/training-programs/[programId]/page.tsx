"use server";

import {
  getTrainingProgram,
  updateTrainingProgram,
  listEnrollments,
  registerMemberForCourse,
  unregisterMemberFromCourse,
} from "@/lib/training-programs";
import { listClassSessions } from "@/lib/class-sessions";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { listMembers } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, PlusCircle } from "lucide-react";

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

  const [program, sessions, branches, coaches, members, enrollments] = await Promise.all([
    getTrainingProgram(programId),
    listClassSessions({ programId }),
    listBranches(),
    listCoaches(),
    listMembers(),
    listEnrollments(programId),
  ]);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const coachMap = new Map(coaches.map((c) => [c.id, c.fullName]));

  async function handleUpdate(formData: FormData) {
    "use server";
    const branchId = (formData.get("branchId") as string) || null;
    const maxMembersRaw = formData.get("maxMembers") as string;
    const priceRaw = formData.get("price") as string;
    const defaultCoachId = (formData.get("defaultCoachId") as string) || null;
    await updateTrainingProgram(programId, {
      name: formData.get("name") as string,
      branchId,
      description: (formData.get("description") as string) || undefined,
      color: (formData.get("color") as string) || undefined,
      maxMembers: maxMembersRaw ? Number(maxMembersRaw) : undefined,
      defaultCoachId,
      active: formData.get("active") === "true",
      price: priceRaw ? Number(priceRaw) : undefined,
      startDate: (formData.get("startDate") as string) || null,
      endDate: (formData.get("endDate") as string) || null,
    });
    redirect(`/app/training-programs/${programId}`);
  }

  async function handleRegister(formData: FormData) {
    "use server";
    const memberId = formData.get("memberId") as string;
    await registerMemberForCourse(programId, memberId);
    redirect(`/app/training-programs/${programId}`);
  }

  async function handleUnregister(formData: FormData) {
    "use server";
    const memberId = formData.get("memberId") as string;
    await unregisterMemberFromCourse(programId, memberId);
    redirect(`/app/training-programs/${programId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  const upcoming = sessions
    .filter((s) => s.status !== "cancelled")
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const enrolledMemberIds = new Set(activeEnrollments.map((e) => e.memberId));
  const registerableMembers = members.filter((m) => !enrolledMemberIds.has(m.id));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.classes.title}
        title={program.name}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button href={`/app/training-programs/${programId}/schedule`} variant="secondary">
              {t.classes.scheduleTitle}
            </Button>
            <Button href={`/app/training-programs/${programId}/report`} variant="secondary">
              {t.classes.viewReport}
            </Button>
            <Button href="/app/training-programs" variant="secondary">
              {t.classes.allPrograms}
            </Button>
          </div>
        }
      />

      <Card animate delay={1}>
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
              <label htmlFor="price" className="text-sm font-medium">{t.classes.price}</label>
              <input id="price" name="price" type="number" min="0" step="0.01" defaultValue={program.price} className={inputCls} />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">{t.classes.startDate}</label>
              <input id="startDate" name="startDate" type="date" defaultValue={program.startDate ?? ""} className={inputCls} />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">{t.classes.endDate}</label>
              <input id="endDate" name="endDate" type="date" defaultValue={program.endDate ?? ""} className={inputCls} />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="active" className="text-sm font-medium">{t.status.active}</label>
              <select id="active" name="active" defaultValue={String(program.active)} className={selectCls}>
                <option value="true">{t.status.active}</option>
                <option value="false">{t.status.inactive}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2 sm:col-span-2">
              <Button type="submit" variant="primary" size="sm">
                {t.actions.save}
              </Button>
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
            <div>
              <dt className="text-foreground/55">{t.classes.price}</dt>
              <dd className="mt-0.5 font-mono font-medium">{program.price.toLocaleString()}</dd>
            </div>
            {(program.startDate || program.endDate) && (
              <div>
                <dt className="text-foreground/55">{t.classes.startDate} – {t.classes.endDate}</dt>
                <dd className="mt-0.5 font-medium">{program.startDate ?? "—"} – {program.endDate ?? "—"}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      <Card animate delay={2}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.classes.rosterTitle}
        </p>
        <p className="mt-1 text-sm text-foreground/60">{t.classes.rosterHint}</p>

        <div className="mt-4 grid gap-2">
          {activeEnrollments.length === 0 && (
            <p className="text-sm text-foreground/60">{t.classes.noStudentsRegistered}</p>
          )}
          {activeEnrollments
            .slice()
            .sort((a, b) => a.member.fullName.localeCompare(b.member.fullName))
            .map((enrollment) => (
              <div
                key={enrollment.memberId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{enrollment.member.fullName}</p>
                  <p className="text-xs text-foreground/50">{enrollment.member.memberNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-foreground/70">
                    {enrollment.finalPrice.toLocaleString()}
                  </span>
                  {canManage && (
                    <form action={handleUnregister}>
                      <input type="hidden" name="memberId" value={enrollment.memberId} />
                      <Button type="submit" variant="danger" size="sm">
                        {t.classes.unregisterStudent}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
        </div>

        {canManage && registerableMembers.length > 0 && (
          <form action={handleRegister} className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-1.5">
              <label htmlFor="memberId" className="text-sm font-medium">{t.classes.addStudent}</label>
              <select id="memberId" name="memberId" required defaultValue="" className={selectCls}>
                <option value="" disabled>{t.classes.selectMember}</option>
                {registerableMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName} ({m.memberNumber})</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.classes.addStudent}
            </Button>
          </form>
        )}
      </Card>

      <Card animate delay={3}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
            {t.classes.sessionsTitle}
          </p>
          {canManage && (
            <div className="flex gap-2">
              <Button
                href={`/app/training-programs/${programId}/schedule`}
                variant="secondary"
                size="sm"
                icon={<CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />}
              >
                {t.classes.generateSessions}
              </Button>
              <Button
                href={`/app/training-programs/${programId}/sessions/new`}
                variant="primary"
                size="sm"
                icon={<PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />}
              >
                {t.classes.newSession}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3">
          {upcoming.length === 0 && (
            <p className="text-sm text-foreground/60">{t.classes.noSessions}</p>
          )}
          {upcoming.map((s) => (
            <article
              key={s.id}
              className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_16px_36px_-16px_rgba(86,57,28,0.22)] sm:flex-row sm:items-center sm:justify-between"
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
                <Badge tone="outline">
                  {s.bookedCount}/{s.capacity} {t.classes.bookedCount.toLowerCase()}
                </Badge>
                <Button href={`/app/training-programs/${programId}/sessions/${s.id}`} variant="secondary" size="sm">
                  {t.classes.viewSession}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
