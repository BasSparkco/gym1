"use server";

import { getMember } from "@/lib/members";
import {
  listTrainingPrograms,
  listEnrollmentsForMember,
  registerMemberForCourse,
} from "@/lib/training-programs";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function RegisterCoursePage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, programs, enrollments] = await Promise.all([
    getMember(memberId),
    listTrainingPrograms(),
    listEnrollmentsForMember(memberId),
  ]);
  const currencySymbol = await getActiveCurrencySymbol(member.homeBranchId);

  const activeProgramIds = new Set(
    enrollments.filter((e) => e.status === "active").map((e) => e.programId),
  );
  const availablePrograms = programs.filter(
    (p) => p.active && !activeProgramIds.has(p.id),
  );

  async function handleRegister(formData: FormData) {
    "use server";
    const programId = formData.get("programId") as string;
    await registerMemberForCourse(programId, memberId);
    redirect(`/app/members/${memberId}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.classes.registerForCourse} — ${member.fullName}`}
      />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        {availablePrograms.length === 0 ? (
          <p className="text-sm text-foreground/60">{t.classes.noCoursesAvailable}</p>
        ) : (
          <form action={handleRegister} className="grid gap-5">
            <div className="grid gap-1.5">
              <label htmlFor="programId" className="text-sm font-medium">
                {t.classes.selectCourse}
              </label>
              <select id="programId" name="programId" required defaultValue="" className={inputCls}>
                <option value="" disabled>
                  {t.classes.selectCourse}
                </option>
                {availablePrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {currencySymbol}{p.price.toLocaleString()}
                    {p.startDate && p.endDate ? ` (${p.startDate} – ${p.endDate})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                icon={<GraduationCap className="h-4 w-4" strokeWidth={2} />}
              >
                {t.classes.registerForCourse}
              </Button>
              <Button href={`/app/members/${memberId}`} variant="secondary">
                {t.actions.cancel}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
