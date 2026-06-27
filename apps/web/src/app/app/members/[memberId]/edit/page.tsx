"use server";

import { getMember, getMemberPhotoUrl, updateMember } from "@/lib/members";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/date-format";
import { apiBaseUrl } from "@/lib/auth";
import MemberPhotoUpload from "@/components/members/member-photo-upload";
import DateInput from "@/components/date-input";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ memberId: string }> };

export default async function EditMemberPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();
  const [member, branches, employees, settings] = await Promise.all([
    getMember(memberId),
    listBranches(),
    listEmployees(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  async function handleUpdate(formData: FormData) {
    "use server";
    const heightRaw = formData.get("height") as string;
    const weightRaw = formData.get("weight") as string;
    await updateMember(memberId, {
      fullName: (formData.get("fullName") as string) || undefined,
      homeBranchId: (formData.get("homeBranchId") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      sex: (formData.get("sex") as "male" | "female") || undefined,
      idNumber: (formData.get("idNumber") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      height: heightRaw ? Number(heightRaw) : undefined,
      weight: weightRaw ? Number(weightRaw) : undefined,
      registeredEmployeeId: (formData.get("registeredEmployeeId") as string) || undefined,
      emergencyContactName: (formData.get("emergencyContactName") as string) || undefined,
      emergencyContactPhone: (formData.get("emergencyContactPhone") as string) || undefined,
      medicalNotes: (formData.get("medicalNotes") as string) || undefined,
      rfidTag: (formData.get("rfidTag") as string) || undefined,
    });
    redirect(`/app/members/${memberId}`);
  }

  const inputClass = "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const currentPhotoUrl = getMemberPhotoUrl(member.pictureUrl);

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

      {/* Photo upload — client component, independent of the form */}
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.photo}</p>
        <MemberPhotoUpload
          memberId={memberId}
          currentPhotoUrl={currentPhotoUrl}
          apiBaseUrl={apiBaseUrl}
        />
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleUpdate} className="grid gap-6">

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.basicInfo}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  {t.members.fullName} <span className="text-red-500">*</span>
                </label>
                <input id="fullName" name="fullName" required defaultValue={member.fullName} className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="sex" className="text-sm font-medium">{t.members.sex}</label>
                <select id="sex" name="sex" defaultValue={member.sex ?? ""} className={inputClass}>
                  <option value="">—</option>
                  <option value="male">{t.members.male}</option>
                  <option value="female">{t.members.female}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="idNumber" className="text-sm font-medium">{t.members.idNumber}</label>
                <input id="idNumber" name="idNumber" defaultValue={member.idNumber} placeholder="e.g. 123456789" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium">{t.members.phone}</label>
                <input id="phone" name="phone" type="tel" defaultValue={member.phone} placeholder="e.g. +970-59-000-0000" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">{t.members.email}</label>
                <input id="email" name="email" type="email" defaultValue={member.email} placeholder="e.g. lina@example.com" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">{t.members.dateOfBirth}</label>
                <DateInput id="dateOfBirth" name="dateOfBirth" dateFormat={dateFormat} defaultValue={member.dateOfBirth} />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">{t.members.joinDate}</label>
                <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/60">
                  {formatDate(member.joinDate, dateFormat)}
                </p>
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="address" className="text-sm font-medium">{t.members.address}</label>
                <input id="address" name="address" defaultValue={member.address} placeholder="e.g. Al-Irsal St, Ramallah" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="height" className="text-sm font-medium">{t.members.height}</label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  min="50"
                  max="250"
                  defaultValue={member.height ?? ""}
                  placeholder="e.g. 175"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="weight" className="text-sm font-medium">{t.members.weight}</label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  min="20"
                  max="300"
                  defaultValue={member.weight ?? ""}
                  placeholder="e.g. 75"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="homeBranchId" className="text-sm font-medium">{t.members.homeBranch}</label>
                <select id="homeBranchId" name="homeBranchId" defaultValue={member.homeBranchId} className={inputClass}>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="registeredEmployeeId" className="text-sm font-medium">{t.members.registeredEmployee}</label>
                <select
                  id="registeredEmployeeId"
                  name="registeredEmployeeId"
                  defaultValue={member.registeredEmployeeId ?? ""}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.employeeNumber})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-4">{t.members.emergencyContact}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="emergencyContactName" className="text-sm font-medium">{t.members.contactName}</label>
                <input id="emergencyContactName" name="emergencyContactName" defaultValue={member.emergencyContactName} placeholder="e.g. Ahmad Khalil" className={inputClass} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="emergencyContactPhone" className="text-sm font-medium">{t.members.contactPhone}</label>
                <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" defaultValue={member.emergencyContactPhone} placeholder="e.g. +970-59-000-0000" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Medical Notes */}
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

          {/* Access Control */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50 mb-4">Access Control</p>
            <div className="grid gap-1.5 sm:max-w-xs">
              <label htmlFor="rfidTag" className="text-sm font-medium">RFID Tag ID</label>
              <input
                id="rfidTag"
                name="rfidTag"
                defaultValue={member.rfidTag}
                placeholder="e.g. A3F20C1D"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-mono uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="text-xs text-foreground/50">Scan or type the tag ID printed on the member's RFID card.</p>
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
