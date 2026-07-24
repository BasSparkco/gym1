"use server";

import { createTrainingProgram } from "@/lib/training-programs";
import { listBranches } from "@/lib/branches";
import { listCoaches } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default async function NewTrainingProgramPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [branches, coaches] = await Promise.all([listBranches(), listCoaches()]);

  async function handleCreate(formData: FormData) {
    "use server";
    const branchId = (formData.get("branchId") as string) || null;
    const maxMembersRaw = formData.get("maxMembers") as string;
    const priceRaw = formData.get("price") as string;
    const defaultCoachId = (formData.get("defaultCoachId") as string) || null;
    const program = await createTrainingProgram({
      name: formData.get("name") as string,
      branchId,
      description: (formData.get("description") as string) || undefined,
      color: (formData.get("color") as string) || undefined,
      maxMembers: maxMembersRaw ? Number(maxMembersRaw) : undefined,
      defaultCoachId,
      price: priceRaw ? Number(priceRaw) : undefined,
      startDate: (formData.get("startDate") as string) || null,
      endDate: (formData.get("endDate") as string) || null,
    });
    redirect(`/app/training-programs/${program.id}`);
  }

  const inputCls =
    "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const selectCls = inputCls;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={t.classes.title} title={t.classes.newProgram} />

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t.classes.programName} <span className="text-red-500">*</span>
            </label>
            <input id="name" name="name" required placeholder="e.g. CrossFit" className={inputCls} />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <label htmlFor="description" className="text-sm font-medium">{t.classes.description}</label>
            <textarea id="description" name="description" rows={3} className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="branchId" className="text-sm font-medium">{t.employees.branch}</label>
            <select id="branchId" name="branchId" defaultValue="" className={selectCls}>
              <option value="">{t.classes.allBranches}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="defaultCoachId" className="text-sm font-medium">{t.classes.defaultCoach}</label>
            <select id="defaultCoachId" name="defaultCoachId" defaultValue="" className={selectCls}>
              <option value="">{t.classes.noCoach}</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>{coach.fullName}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="maxMembers" className="text-sm font-medium">{t.classes.maxMembers}</label>
            <input id="maxMembers" name="maxMembers" type="number" min="1" className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="color" className="text-sm font-medium">{t.classes.color}</label>
            <input id="color" name="color" type="color" defaultValue="#5B8DEF" className={`${inputCls} h-11 p-1`} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="price" className="text-sm font-medium">{t.classes.price}</label>
            <input id="price" name="price" type="number" min="0" step="0.01" defaultValue={0} className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="startDate" className="text-sm font-medium">{t.classes.startDate}</label>
            <input id="startDate" name="startDate" type="date" className={inputCls} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="endDate" className="text-sm font-medium">{t.classes.endDate}</label>
            <input id="endDate" name="endDate" type="date" className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2 sm:col-span-2">
            <Button type="submit" variant="primary" icon={<PlusCircle className="h-4 w-4" strokeWidth={2} />}>
              {t.classes.createProgram}
            </Button>
            <Button href="/app/training-programs" variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
