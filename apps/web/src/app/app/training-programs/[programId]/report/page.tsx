"use server";

import { getAttendanceReport } from "@/lib/training-programs";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";

type Props = {
  params: Promise<{ programId: string }>;
};

const cellTone: Record<string, BadgeTone> = {
  attended: "success",
  noShow: "danger",
  booked: "info",
  waitlisted: "warning",
  cancelled: "neutral",
};

export default async function CourseAttendanceReportPage({ params }: Props) {
  const { programId } = await params;
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager" && session.role !== "front-desk") {
    redirect("/app/dashboard");
  }

  const report = await getAttendanceReport(programId);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={report.program.name}
        title={t.classes.attendanceReportTitle}
        description={t.classes.attendanceReportHint}
        actions={
          <Button href={`/app/training-programs/${programId}`} variant="secondary">
            {report.program.name}
          </Button>
        }
      />

      <Card animate delay={1}>
        {report.sessions.length === 0 ? (
          <p className="text-sm text-foreground/60">{t.classes.noLessonsYet}</p>
        ) : report.students.length === 0 ? (
          <p className="text-sm text-foreground/60">{t.classes.noStudentsRegistered}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs uppercase tracking-wide text-foreground/50">
                  <th className="px-3 py-2 text-start">{t.classes.member}</th>
                  {report.sessions.map((s) => (
                    <th key={s.id} className="px-3 py-2 text-center font-mono">
                      {s.date}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center">{t.classes.present}</th>
                  <th className="px-3 py-2 text-center">{t.classes.absent}</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((student) => (
                  <tr key={student.memberId} className="border-b border-line/60">
                    <td className="px-3 py-2">
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-xs text-foreground/50">{student.memberNumber}</p>
                    </td>
                    {student.lessons.map((lesson) => (
                      <td key={lesson.sessionId} className="px-3 py-2 text-center">
                        {lesson.status ? (
                          <Badge tone={cellTone[lesson.status] ?? "neutral"}>
                            {t.classes[
                              (`booking${lesson.status.charAt(0).toUpperCase()}${lesson.status.slice(1)}`) as keyof typeof t.classes
                            ] ?? lesson.status}
                          </Badge>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-mono">{student.totals.attended}</td>
                    <td className="px-3 py-2 text-center font-mono">{student.totals.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
