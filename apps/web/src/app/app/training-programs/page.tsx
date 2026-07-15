"use server";

import { listTrainingPrograms } from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarCheck, PlusCircle } from "lucide-react";

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

      <section className="grid gap-3">
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
