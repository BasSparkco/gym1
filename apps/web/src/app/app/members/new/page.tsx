"use server";

import { createMember, uploadMemberPhoto } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import DateInput from "@/components/date-input";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewMemberPage() {
  await requireSession();
  const t = await getT();
  const [branches, employees, settings] = await Promise.all([listBranches(), listEmployees(), getSettings()]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  async function handleCreate(formData: FormData) {
    "use server";
    const heightRaw = formData.get("height") as string;
    const weightRaw = formData.get("weight") as string;
    const member = await createMember({
      fullName: formData.get("fullName") as string,
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
    const picture = formData.get("picture") as File | null;
    if (picture && picture.size > 0) {
      await uploadMemberPhoto(member.id, picture);
    }
    redirect(`/app/members/${member.id}`);
  }

  const inputClass = "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.members}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.members.newMember}</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          Register a new member. Full name is required.
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-6" encType="multipart/form-data">

          {/* Photo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.photo}</p>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-foreground/30 text-3xl flex-shrink-0">
                👤
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="picture" className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand inline-block">
                  {t.members.uploadPhoto}
                </label>
                <input
                  id="picture"
                  name="picture"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                />
                <p className="text-xs text-foreground/50">JPG, PNG or WEBP — max 5 MB. On mobile, tap to use camera or choose a file.</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.basicInfo}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  {t.members.fullName} <span className="text-red-500">*</span>
                </label>
                <input id="fullName" name="fullName" required placeholder="e.g. Lina Ahmad" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="sex" className="text-sm font-medium">{t.members.sex}</label>
                <select id="sex" name="sex" className={inputClass}>
                  <option value="">—</option>
                  <option value="male">{t.members.male}</option>
                  <option value="female">{t.members.female}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="idNumber" className="text-sm font-medium">{t.members.idNumber}</label>
                <input id="idNumber" name="idNumber" placeholder="e.g. 123456789" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium">{t.members.phone}</label>
                <input id="phone" name="phone" type="tel" placeholder="e.g. +970-59-000-0000" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">{t.members.email}</label>
                <input id="email" name="email" type="email" placeholder="e.g. lina@example.com" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="dateOfBirth" className="text-sm font-medium">{t.members.dateOfBirth}</label>
                <DateInput id="dateOfBirth" name="dateOfBirth" dateFormat={dateFormat} />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="address" className="text-sm font-medium">{t.members.address}</label>
                <input id="address" name="address" placeholder="e.g. Al-Irsal St, Ramallah" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="height" className="text-sm font-medium">{t.members.height}</label>
                <input id="height" name="height" type="number" min="50" max="250" placeholder="e.g. 175" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="weight" className="text-sm font-medium">{t.members.weight}</label>
                <input id="weight" name="weight" type="number" min="20" max="300" placeholder="e.g. 75" className={inputClass} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="homeBranchId" className="text-sm font-medium">{t.members.homeBranch}</label>
                <select id="homeBranchId" name="homeBranchId" className={inputClass}>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <label htmlFor="registeredEmployeeId" className="text-sm font-medium">{t.members.registeredEmployee}</label>
                <select id="registeredEmployeeId" name="registeredEmployeeId" className={inputClass}>
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
                <input id="emergencyContactName" name="emergencyContactName" placeholder="e.g. Ahmad Khalil" className={inputClass} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="emergencyContactPhone" className="text-sm font-medium">{t.members.contactPhone}</label>
                <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" placeholder="e.g. +970-59-000-0000" className={inputClass} />
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
              {t.members.newMember}
            </button>
            <Link
              href="/app/members"
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
