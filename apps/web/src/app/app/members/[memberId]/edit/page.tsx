"use server";

import { getMember, updateMember } from "@/lib/members";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ memberId: string }> };

export default async function EditMemberPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();
  const [member, branches] = await Promise.all([getMember(memberId), listBranches()]);

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateMember(memberId, {
      fullName: (formData.get("fullName") as string) || undefined,
      homeBranchId: (formData.get("homeBranchId") as string) || undefined,
      status: formData.get("status") as "active" | "inactive",
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      emergencyContactName: (formData.get("emergencyContactName") as string) || undefined,
      emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || undefined,
      medicalNotes: (formData.get("medicalNotes") as string) || undefined,
    });
    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.members}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.members.editMember}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          {member.fullName} · {member.memberNumber}
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-6">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.basicInfo}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  {t.members.fullName} <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={member.fullName}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium">{t.members.phone}</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={member.phone}
                  placeholder="e.g. +970-59-000-0000"
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">{t.members.email}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={member.email}
                  placeholder="e.g. lina@example.com"
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">{t.members.dateOfBirth}</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={member.dateOfBirth}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="homeBranchId" className="text-sm font-medium">{t.members.homeBranch}</label>
                <select
                  id="homeBranchId"
                  name="homeBranchId"
                  defaultValue={member.homeBranchId}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="status" className="text-sm font-medium">{t.members.statusLabel}</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={member.status}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="active">{t.status.active}</option>
                  <option value="inactive">{t.status.inactive}</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-4">{t.members.emergencyContact}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="emergencyContactName" className="text-sm font-medium">{t.members.contactName}</label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  defaultValue={member.emergencyContactName}
                  placeholder="e.g. Ahmad Khalil"
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="emergencyContactPhone" className="text-sm font-medium">{t.members.contactPhone}</label>
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  defaultValue={member.emergencyContactPhone}
                  placeholder="e.g. +970-59-000-0000"
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50 mb-4">{t.members.medicalNotes}</p>
            <div className="grid gap-1.5">
              <label htmlFor="medicalNotes" className="text-sm font-medium">{t.members.notes}</label>
              <textarea
                id="medicalNotes"
                name="medicalNotes"
                rows={3}
                defaultValue={member.medicalNotes}
                placeholder="Any relevant medical information or health conditions…"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
            >
              {t.actions.saveChanges}
            </button>
            <Link
              href={`/app/members/${memberId}`}
              className="rounded-full border border-line bg-white px-6 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
            >
              {t.actions.cancel}
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
