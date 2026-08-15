import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import DateInput from "@/components/date-input";
import MemberPhotoUpload from "@/components/members/member-photo-upload";
import { apiBaseUrl } from "@/lib/auth";
import type { Member } from "@/lib/members";
import type { Branch } from "@/lib/branches";
import type { Employee } from "@/lib/employees";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import { formatDate } from "@/lib/date-format";

const inputCls =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

type Props = {
  member: Member;
  photoUrl: string | null;
  branches: Branch[];
  employees: Employee[];
  dateFormat: DateFormat;
  t: Dict;
  action: (formData: FormData) => void | Promise<void>;
  submitIcon: ReactNode;
  footer?: ReactNode;
};

// Shared by the dedicated /app/members/[memberId]/edit page and the inline
// edit panel in the members table (MembersTableBody), so the two forms can
// never drift out of sync — one component, two places it's mounted.
export function MemberEditForm({ member, photoUrl, branches, employees, dateFormat, t, action, submitIcon, footer }: Props) {
  const id = (field: string) => `${field}-${member.id}`;

  return (
    <div className="grid min-w-0 gap-6">
      {/* Photo upload — client component, independent of the form */}
      <section className="animate-fade-in-up min-w-0 rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.photo}</p>
        <MemberPhotoUpload memberId={member.id} currentPhotoUrl={photoUrl} apiBaseUrl={apiBaseUrl} />
      </section>

      <section className="animate-fade-in-up min-w-0 rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={action} className="grid min-w-0 gap-6">
          <input type="hidden" name="memberId" value={member.id} />

          {/* Basic Info */}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.basicInfo}</p>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={id("fullName")} className="text-sm font-medium">
                    {t.members.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input id={id("fullName")} name="fullName" required defaultValue={member.fullName} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={id("address")} className="text-sm font-medium">{t.members.address}</label>
                  <input id={id("address")} name="address" defaultValue={member.address} placeholder="e.g. Al-Irsal St, Ramallah" className={inputCls} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("sex")} className="text-sm font-medium">{t.members.sex}</label>
                <select id={id("sex")} name="sex" defaultValue={member.sex ?? ""} className={inputCls}>
                  <option value="">—</option>
                  <option value="male">{t.members.male}</option>
                  <option value="female">{t.members.female}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("idNumber")} className="text-sm font-medium">{t.members.idNumber}</label>
                <input id={id("idNumber")} name="idNumber" defaultValue={member.idNumber} placeholder="e.g. 123456789" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("phone")} className="text-sm font-medium">{t.members.phone}</label>
                <input id={id("phone")} name="phone" type="tel" defaultValue={member.phone} placeholder="e.g. +970-59-000-0000" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("email")} className="text-sm font-medium">{t.members.email}</label>
                <input id={id("email")} name="email" type="email" defaultValue={member.email} placeholder="e.g. lina@example.com" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("dateOfBirth")} className="text-sm font-medium">{t.members.dateOfBirth}</label>
                <DateInput id={id("dateOfBirth")} name="dateOfBirth" dateFormat={dateFormat} defaultValue={member.dateOfBirth} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={member.joinDate ? undefined : id("joinDate")} className="text-sm font-medium">
                  {t.members.joinDate}
                </label>
                {member.joinDate ? (
                  <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/60">
                    {formatDate(member.joinDate, dateFormat)}
                  </p>
                ) : (
                  <>
                    <DateInput id={id("joinDate")} name="joinDate" dateFormat={dateFormat} />
                    <p className="text-xs text-foreground/50">{t.members.joinDateHelp}</p>
                  </>
                )}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("height")} className="text-sm font-medium">{t.members.height}</label>
                <input
                  id={id("height")}
                  name="height"
                  type="number"
                  min="50"
                  max="250"
                  defaultValue={member.height ?? ""}
                  placeholder="e.g. 175"
                  className={inputCls}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("weight")} className="text-sm font-medium">{t.members.weight}</label>
                <input
                  id={id("weight")}
                  name="weight"
                  type="number"
                  min="20"
                  max="300"
                  defaultValue={member.weight ?? ""}
                  placeholder="e.g. 75"
                  className={inputCls}
                />
              </div>

              <div className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={id("homeBranchId")} className="text-sm font-medium">{t.members.homeBranch}</label>
                  <select id={id("homeBranchId")} name="homeBranchId" defaultValue={member.homeBranchId} className={inputCls}>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={id("registeredEmployeeId")} className="text-sm font-medium">{t.members.registeredEmployee}</label>
                  <select
                    id={id("registeredEmployeeId")}
                    name="registeredEmployeeId"
                    defaultValue={member.registeredEmployeeId ?? ""}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.fullName} ({e.employeeNumber})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-4">{t.members.emergencyContact}</p>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor={id("emergencyContactName")} className="text-sm font-medium">{t.members.contactName}</label>
                <input id={id("emergencyContactName")} name="emergencyContactName" defaultValue={member.emergencyContactName} placeholder="e.g. Ahmad Khalil" className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={id("emergencyContactPhone")} className="text-sm font-medium">{t.members.contactPhone}</label>
                <input id={id("emergencyContactPhone")} name="emergencyContactPhone" type="tel" defaultValue={member.emergencyContactPhone} placeholder="e.g. +970-59-000-0000" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Medical Notes */}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50 mb-4">{t.members.medicalNotes}</p>
            <div className="grid gap-1.5">
              <label htmlFor={id("medicalNotes")} className="text-sm font-medium">{t.members.notes}</label>
              <textarea
                id={id("medicalNotes")}
                name="medicalNotes"
                rows={3}
                defaultValue={member.medicalNotes}
                placeholder="Any relevant medical information or health conditions…"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={submitIcon}>
              {t.actions.saveChanges}
            </Button>
            {footer}
          </div>
        </form>
      </section>
    </div>
  );
}
