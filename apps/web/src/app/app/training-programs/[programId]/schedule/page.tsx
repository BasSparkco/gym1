"use server";

import {
  getTrainingProgram,
  getScheduleSlots,
  setScheduleSlots,
  generateProgramSessions,
} from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, PlusCircle, XCircle } from "lucide-react";

type Props = {
  params: Promise<{ programId: string }>;
};

const dayKeys = [
  "daySunday",
  "dayMonday",
  "dayTuesday",
  "dayWednesday",
  "dayThursday",
  "dayFriday",
  "daySaturday",
] as const satisfies readonly (keyof Dict["classes"])[];

export default async function ProgramSchedulePage({ params }: Props) {
  const { programId } = await params;
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [program, slots, branches] = await Promise.all([
    getTrainingProgram(programId),
    getScheduleSlots(programId),
    listBranches(),
  ]);

  const sortedSlots = slots.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  async function handleAddSlot(formData: FormData) {
    "use server";
    const existing = JSON.parse(formData.get("existingSlots") as string) as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    const dayOfWeek = Number(formData.get("dayOfWeek"));
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    await setScheduleSlots(programId, [...existing, { dayOfWeek, startTime, endTime }]);
    redirect(`/app/training-programs/${programId}/schedule`);
  }

  async function handleRemoveSlot(formData: FormData) {
    "use server";
    const remaining = JSON.parse(formData.get("remainingSlots") as string) as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
    await setScheduleSlots(programId, remaining);
    redirect(`/app/training-programs/${programId}/schedule`);
  }

  async function handleGenerate(formData: FormData) {
    "use server";
    const branchId = (formData.get("branchId") as string) || undefined;
    await generateProgramSessions(programId, branchId);
    redirect(`/app/training-programs/${programId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  const existingSlotsJson = JSON.stringify(
    sortedSlots.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={program.name}
        title={t.classes.scheduleTitle}
        description={t.classes.scheduleHint}
        actions={
          <Button href={`/app/training-programs/${programId}`} variant="secondary">
            {program.name}
          </Button>
        }
      />

      <Card animate delay={1}>
        <div className="grid gap-2">
          {sortedSlots.length === 0 && (
            <p className="text-sm text-foreground/60">{t.classes.noLessonsYet}</p>
          )}
          {sortedSlots.map((slot, index) => {
            const remaining = sortedSlots.filter((_, i) => i !== index).map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            }));
            return (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3"
              >
                <p className="text-sm font-medium">
                  {t.classes[dayKeys[slot.dayOfWeek]]} · {slot.startTime}–{slot.endTime}
                </p>
                <form action={handleRemoveSlot}>
                  <input type="hidden" name="remainingSlots" value={JSON.stringify(remaining)} />
                  <Button type="submit" variant="danger" size="sm" icon={<XCircle className="h-3.5 w-3.5" strokeWidth={2} />}>
                    {t.classes.removeSlot}
                  </Button>
                </form>
              </div>
            );
          })}
        </div>

        <form action={handleAddSlot} className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <input type="hidden" name="existingSlots" value={existingSlotsJson} />
          <div className="grid gap-1.5">
            <label htmlFor="dayOfWeek" className="text-sm font-medium">{t.classes.dayOfWeek}</label>
            <select id="dayOfWeek" name="dayOfWeek" required defaultValue="" className={selectCls}>
              <option value="" disabled>{t.classes.dayOfWeek}</option>
              {dayKeys.map((key, index) => (
                <option key={key} value={index}>{t.classes[key]}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="startTime" className="text-sm font-medium">{t.classes.startTime}</label>
            <input id="startTime" name="startTime" type="time" required className={inputCls} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="endTime" className="text-sm font-medium">{t.classes.endTime}</label>
            <input id="endTime" name="endTime" type="time" required className={inputCls} />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.classes.addSlot}
            </Button>
          </div>
        </form>
      </Card>

      <Card animate delay={2}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          {t.classes.generateSessions}
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          {program.startDate ?? "—"} – {program.endDate ?? "—"}
        </p>

        <form action={handleGenerate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          {!program.branchId && (
            <div className="grid flex-1 gap-1.5">
              <label htmlFor="branchId" className="text-sm font-medium">{t.employees.branch}</label>
              <select id="branchId" name="branchId" required defaultValue="" className={selectCls}>
                <option value="" disabled>{t.employees.branch}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" variant="primary" icon={<CalendarClock className="h-4 w-4" strokeWidth={2} />}>
            {t.classes.generateSessions}
          </Button>
        </form>
      </Card>
    </div>
  );
}
