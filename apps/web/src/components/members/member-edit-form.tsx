"use client";

import { startTransition, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { unstable_rethrow } from "next/navigation";
import { Loader2 } from "lucide-react";
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

// All editable fields, tracked as strings (matching how every input/select
// exposes its value) so a plain shallow diff against the last-saved snapshot
// is enough to know whether the form is dirty — no schema/validation library
// needed just to answer "did anything change".
type FormValues = {
  fullName: string;
  address: string;
  sex: string;
  idNumber: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  joinDate: string;
  height: string;
  weight: string;
  homeBranchId: string;
  registeredEmployeeId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
};

function toFormValues(member: Member): FormValues {
  return {
    fullName: member.fullName ?? "",
    address: member.address ?? "",
    sex: member.sex ?? "",
    idNumber: member.idNumber ?? "",
    phone: member.phone ?? "",
    email: member.email ?? "",
    dateOfBirth: member.dateOfBirth ?? "",
    joinDate: member.joinDate ?? "",
    height: member.height != null ? String(member.height) : "",
    weight: member.weight != null ? String(member.weight) : "",
    homeBranchId: member.homeBranchId ?? "",
    registeredEmployeeId: member.registeredEmployeeId ?? "",
    emergencyContactName: member.emergencyContactName ?? "",
    emergencyContactPhone: member.emergencyContactPhone ?? "",
    medicalNotes: member.medicalNotes ?? "",
  };
}

// Shared by the dedicated /app/members/[memberId]/edit page and the inline
// edit panel in the members table (MembersTableBody), so the two forms can
// never drift out of sync — one component, two places it's mounted.
export function MemberEditForm({ member, photoUrl, branches, employees, dateFormat, t, action, submitIcon, footer }: Props) {
  const id = (field: string) => `${field}-${member.id}`;

  // `initialValues` is the last-known-saved snapshot — the baseline the Save
  // button's dirty check compares against. It starts from the member prop
  // and is replaced with `values` on every successful save, so "dirty" always
  // means "differs from what's actually on the server", not from page load.
  const [initialValues, setInitialValues] = useState<FormValues>(() => toFormValues(member));
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => (Object.keys(initialValues) as (keyof FormValues)[]).some((key) => values[key] !== initialValues[key]),
    [values, initialValues],
  );

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (saveError) setSaveError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || isSaving) return;

    // Server Actions need to run inside a transition for Next.js to apply
    // their revalidatePath()-triggered refresh as a scoped patch rather than
    // a full route reset — calling one as a bare awaited function outside
    // startTransition was observed to reset sibling client state (e.g. the
    // members table's "which row is expanded" state) on every save.
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setSaveError(null);
    startTransition(async () => {
      try {
        await action(formData);
        setInitialValues(values);
      } catch (err) {
        // The dedicated /edit page's action redirects on success, which
        // Next.js implements as a special thrown value — let it propagate so
        // the navigation actually happens instead of surfacing as an error.
        unstable_rethrow(err);
        setSaveError(t.members.saveError);
      } finally {
        setIsSaving(false);
      }
    });
  }

  // A join date filled in once (e.g. by staff, for a member imported without
  // one) locks — checked against `initialValues`, not the original `member`
  // prop, so it locks immediately after that first save rather than waiting
  // for a full page reload.
  const hasJoinDate = Boolean(initialValues.joinDate);

  return (
    <div className="grid min-w-0 gap-6">
      {/* Photo upload — client component, independent of the form */}
      <section className="animate-fade-in-up min-w-0 rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.photo}</p>
        <MemberPhotoUpload memberId={member.id} currentPhotoUrl={photoUrl} apiBaseUrl={apiBaseUrl} />
      </section>

      <section className="animate-fade-in-up min-w-0 rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form onSubmit={handleSubmit} className="grid min-w-0 gap-6">
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
                  <input
                    id={id("fullName")}
                    name="fullName"
                    required
                    value={values.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={id("address")} className="text-sm font-medium">{t.members.address}</label>
                  <input
                    id={id("address")}
                    name="address"
                    value={values.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="e.g. Al-Irsal St, Ramallah"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("sex")} className="text-sm font-medium">{t.members.sex}</label>
                <select
                  id={id("sex")}
                  name="sex"
                  value={values.sex}
                  onChange={(event) => updateField("sex", event.target.value)}
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="male">{t.members.male}</option>
                  <option value="female">{t.members.female}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("idNumber")} className="text-sm font-medium">{t.members.idNumber}</label>
                <input
                  id={id("idNumber")}
                  name="idNumber"
                  value={values.idNumber}
                  onChange={(event) => updateField("idNumber", event.target.value)}
                  placeholder="e.g. 123456789"
                  className={inputCls}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("phone")} className="text-sm font-medium">{t.members.phone}</label>
                <input
                  id={id("phone")}
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="e.g. +970-59-000-0000"
                  className={inputCls}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("email")} className="text-sm font-medium">{t.members.email}</label>
                <input
                  id={id("email")}
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="e.g. lina@example.com"
                  className={inputCls}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={id("dateOfBirth")} className="text-sm font-medium">{t.members.dateOfBirth}</label>
                <DateInput
                  id={id("dateOfBirth")}
                  name="dateOfBirth"
                  dateFormat={dateFormat}
                  defaultValue={member.dateOfBirth}
                  onChange={(value) => updateField("dateOfBirth", value)}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={hasJoinDate ? undefined : id("joinDate")} className="text-sm font-medium">
                  {t.members.joinDate}
                </label>
                {hasJoinDate ? (
                  <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/60">
                    {formatDate(initialValues.joinDate, dateFormat)}
                  </p>
                ) : (
                  <>
                    <DateInput
                      id={id("joinDate")}
                      name="joinDate"
                      dateFormat={dateFormat}
                      onChange={(value) => updateField("joinDate", value)}
                    />
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
                  value={values.height}
                  onChange={(event) => updateField("height", event.target.value)}
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
                  value={values.weight}
                  onChange={(event) => updateField("weight", event.target.value)}
                  placeholder="e.g. 75"
                  className={inputCls}
                />
              </div>

              <div className="grid min-w-0 gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={id("homeBranchId")} className="text-sm font-medium">{t.members.homeBranch}</label>
                  <select
                    id={id("homeBranchId")}
                    name="homeBranchId"
                    value={values.homeBranchId}
                    onChange={(event) => updateField("homeBranchId", event.target.value)}
                    className={inputCls}
                  >
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
                    value={values.registeredEmployeeId}
                    onChange={(event) => updateField("registeredEmployeeId", event.target.value)}
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
                <input
                  id={id("emergencyContactName")}
                  name="emergencyContactName"
                  value={values.emergencyContactName}
                  onChange={(event) => updateField("emergencyContactName", event.target.value)}
                  placeholder="e.g. Ahmad Khalil"
                  className={inputCls}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={id("emergencyContactPhone")} className="text-sm font-medium">{t.members.contactPhone}</label>
                <input
                  id={id("emergencyContactPhone")}
                  name="emergencyContactPhone"
                  type="tel"
                  value={values.emergencyContactPhone}
                  onChange={(event) => updateField("emergencyContactPhone", event.target.value)}
                  placeholder="e.g. +970-59-000-0000"
                  className={inputCls}
                />
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
                value={values.medicalNotes}
                onChange={(event) => updateField("medicalNotes", event.target.value)}
                placeholder="Any relevant medical information or health conditions…"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={!isDirty || isSaving}
                icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : submitIcon}
              >
                {isSaving ? t.actions.saving : t.actions.saveChanges}
              </Button>
              {footer}
            </div>
            {saveError && <p className="text-sm text-danger">{saveError}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
