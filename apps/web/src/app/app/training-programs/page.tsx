"use server";

import { listTrainingPrograms } from "@/lib/training-programs";
import { listClassSessions } from "@/lib/class-sessions";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { BadgeTone } from "@/components/ui/badge";
import { CalendarCheck, PlusCircle, Clock } from "lucide-react";

function sessionStatusInfo(
  session: Awaited<ReturnType<typeof listClassSessions>>[number],
  t: Dict,
): { label: string; tone: BadgeTone } {
  if (session.status === "cancelled") return { label: t.status.cancelled, tone: "danger" };

  const now = new Date();
  const start = new Date(session.startTime);
  const end = new Date(session.endTime);

  if (now < start) return { label: t.classes.statusUpcoming, tone: "info" };
  if (now > end) return { label: t.classes.statusCompleted, tone: "neutral" };
  if (session.capacity > 0 && session.bookedCount / session.capacity < 0.3) {
    return { label: t.classes.statusLowBookings, tone: "warning" };
  }
  return { label: t.classes.statusInProgress, tone: "success" };
}

export default async function TrainingProgramsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager" && session.role !== "front-desk") {
    redirect("/app/dashboard");
  }

  const canManage = session.role === "owner" || session.role === "manager";

  const [programs, branches, coaches, allSessions] = await Promise.all([
    listTrainingPrograms(),
    listBranches(),
    listCoaches(),
    listClassSessions(),
  ]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const coachMap = new Map(coaches.map((c) => [c.id, c.fullName]));
  const programMap = new Map(programs.map((p) => [p.id, p]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysSessions = allSessions
    .filter((s) => s.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.classes.title}
        title={t.classes.programsTitle}
        description={formatDict(t.classes.listDescription, { count: programs.length, plural: programs.length !== 1 ? "s" : "", tenant: session.tenant.name })}
        actions={
          canManage && (
            <Button
              href="/app/training-programs/new"
              variant="primary"
              icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}
            >
              {t.classes.newProgram}
            </Button>
          )
        }
      />

      <section>
        <h2 className="text-lg font-semibold tracking-tight">{t.classes.todaysSessions}</h2>
        <p className="mt-1 text-sm text-foreground/60">{t.classes.todaysSessionsHelper}</p>
        {todaysSessions.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Clock className="h-5 w-5" strokeWidth={2} />}
            title={t.classes.noSessionsToday}
          />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {todaysSessions.map((cs, index) => {
              const program = programMap.get(cs.programId);
              const { label: statusLabel, tone: statusTone } = sessionStatusInfo(cs, t);
              const pct = cs.capacity > 0 ? Math.min(100, Math.round((cs.bookedCount / cs.capacity) * 100)) : 0;

              return (
                <Card
                  key={cs.id}
                  as={Link}
                  href={`/app/training-programs/${cs.programId}/sessions/${cs.id}`}
                  hoverable
                  animate
                  delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight">
                      {program?.name ?? cs.programId}
                    </h3>
                    <Badge tone={statusTone}>{statusLabel}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-foreground/60">
                    {[cs.coachId && (coachMap.get(cs.coachId) ?? null), cs.room, branchMap.get(cs.branchId)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-mono">
                      {cs.startTime.slice(11, 16)}&ndash;{cs.endTime.slice(11, 16)}
                    </span>
                    <span className="font-mono text-foreground/70">
                      {cs.bookedCount} / {cs.capacity} {t.classes.bookedCount}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-accent"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t.classes.allPrograms}</h2>
        {programs.length === 0 && (
          <EmptyState icon={<CalendarCheck className="h-5 w-5" strokeWidth={2} />} title={t.classes.noPrograms} />
        )}
        {programs.map((program, index) => (
          <Card
            key={program.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{program.name}</h2>
                  <Badge tone={program.active ? "success" : "neutral"}>
                    {program.active ? t.status.active : t.status.inactive}
                  </Badge>
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
              <Button href={`/app/training-programs/${program.id}`} variant="secondary" size="sm">
                {t.actions.view}
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
