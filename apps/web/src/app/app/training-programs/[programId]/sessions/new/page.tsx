"use server";

import { getTrainingProgram } from "@/lib/training-programs";
import { createClassSession, createRecurringClassSessions } from "@/lib/class-sessions";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

type Props = {
  params: Promise<{ programId: string }>;
};

export default async function NewClassSessionPage({ params }: Props) {
  const { programId } = await params;
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [program, branches, coaches] = await Promise.all([
    getTrainingProgram(programId),
    listBranches(),
    listCoaches(),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    const repeatWeeksRaw = formData.get("repeatWeeks") as string;
    const repeatWeeks = repeatWeeksRaw ? Number(repeatWeeksRaw) : 1;

    const input = {
      programId,
      branchId: formData.get("branchId") as string,
      coachId: (formData.get("coachId") as string) || null,
      room: (formData.get("room") as string) || undefined,
      date: formData.get("date") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      capacity: Number(formData.get("capacity")),
    };

    if (repeatWeeks > 1) {
      await createRecurringClassSessions({ ...input, repeatWeeks });
    } else {
      await createClassSession(input);
    }

    redirect(`/app/training-programs/${programId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={program.name} title={t.classes.newSession} />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="branchId" className="text-sm font-medium">
              {t.employees.branch} <span className="text-red-500">*</span>
            </label>
            <select id="branchId" name="branchId" required defaultValue={session.branch.id} className={selectCls}>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="coachId" className="text-sm font-medium">{t.classes.coach}</label>
            <select id="coachId" name="coachId" defaultValue="" className={selectCls}>
              <option value="">{t.classes.noCoach}</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>{coach.fullName}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="room" className="text-sm font-medium">{t.classes.room}</label>
            <input id="room" name="room" className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="capacity" className="text-sm font-medium">
              {t.classes.capacity} <span className="text-red-500">*</span>
            </label>
            <input id="capacity" name="capacity" type="number" min="1" required defaultValue={10} className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="date" className="text-sm font-medium">
              {t.classes.date} <span className="text-red-500">*</span>
            </label>
            <input id="date" name="date" type="date" required className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="repeatWeeks" className="text-sm font-medium">{t.classes.repeatWeeks}</label>
            <input id="repeatWeeks" name="repeatWeeks" type="number" min="1" max="52" defaultValue={1} className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="startTime" className="text-sm font-medium">
              {t.classes.startTime} <span className="text-red-500">*</span>
            </label>
            <input id="startTime" name="startTime" type="time" required className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="endTime" className="text-sm font-medium">
              {t.classes.endTime} <span className="text-red-500">*</span>
            </label>
            <input id="endTime" name="endTime" type="time" required className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2 sm:col-span-2">
            <Button type="submit" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.classes.newSession}
            </Button>
            <Button href={`/app/training-programs/${programId}`} variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
