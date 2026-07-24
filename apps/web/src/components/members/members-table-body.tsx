"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DateInput from "@/components/date-input";
import MemberPhotoUpload from "@/components/members/member-photo-upload";
import { MemberProfileView, type MemberProfileData } from "@/components/members/member-profile-view";
import { updateMemberAction } from "@/app/app/members/actions";
import { apiBaseUrl } from "@/lib/auth";
import type { Branch } from "@/lib/branches";
import type { Employee } from "@/lib/employees";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import type { BadgeTone } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-format";
import { PencilLine } from "lucide-react";

export type { MembershipRow, PaymentRow, LockerRentalRow } from "@/components/members/member-profile-view";

export type MemberRow = MemberProfileData & {
  planBadge?: string;
  expiresText: string;
  expiryColorClass: string;
  statusTone: BadgeTone;
  statusLabelText: string;
};

type Props = {
  rows: MemberRow[];
  branches: Branch[];
  employees: Employee[];
  dateFormat: DateFormat;
  t: Dict;
};

const inputCls =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function MembersTableBody({ rows, branches, employees, dateFormat, t }: Props) {
  const [expanded, setExpanded] = useState<{ id: string; mode: "profile" | "edit" } | null>(null);

  function toggleProfile(id: string) {
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "profile" ? null : { id, mode: "profile" }));
  }

  function toggleEdit(id: string) {
    setExpanded((prev) => (prev && prev.id === id && prev.mode === "edit" ? null : { id, mode: "edit" }));
  }

  return (
    <tbody className="divide-y divide-line">
      {rows.map((row) => {
        const isProfile = expanded?.id === row.member.id && expanded.mode === "profile";
        const isEdit = expanded?.id === row.member.id && expanded.mode === "edit";

        return (
          <Fragment key={row.member.id}>
            <tr
              className="cursor-pointer transition-colors hover:bg-black/[0.02]"
              role="button"
              tabIndex={0}
              onClick={() => toggleProfile(row.member.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleProfile(row.member.id);
                }
              }}
            >
              <td className="py-3 pe-4 text-start">
                <div className="flex items-center gap-3">
                  {row.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-brand/10"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-brand/5 text-xs font-semibold text-brand ring-1 ring-brand/10">
                      {row.avatar}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold tracking-tight hover:text-brand">{row.member.fullName}</p>
                    <p className="font-mono text-xs text-foreground/50">{row.member.memberNumber}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pe-4 text-start">
                {row.planBadge ? (
                  <Badge tone="brand">{row.planBadge}</Badge>
                ) : (
                  <span className="text-xs text-foreground/40">{t.members.noMembershipsYet}</span>
                )}
              </td>
              <td className="py-3 pe-4 text-start text-foreground/70">{row.branchName}</td>
              <td className={`py-3 pe-4 text-start font-mono text-xs ${row.expiryColorClass}`}>{row.expiresText}</td>
              <td className="py-3 pe-4 text-start">
                <Badge tone={row.statusTone}>{row.statusLabelText}</Badge>
              </td>
              <td
                className={`py-3 pe-4 text-start font-mono text-xs ${row.member.debt > 0 ? "text-danger" : "text-foreground/70"}`}
              >
                {row.currencySymbol}
                {row.member.debt.toLocaleString()}
              </td>
              <td className="py-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleEdit(row.member.id);
                    }}
                  >
                    {t.actions.edit}
                  </Button>
                </div>
              </td>
            </tr>

            {(isProfile || isEdit) && (
              <tr>
                <td colSpan={7} className="bg-surface-muted/40 px-4 py-6" onClick={(event) => event.stopPropagation()}>
                  {isProfile ? (
                    <MemberProfileView data={row} t={t} dateFormat={dateFormat} onEditClick={() => toggleEdit(row.member.id)} />
                  ) : (
                    <EditPanel row={row} branches={branches} employees={employees} dateFormat={dateFormat} t={t} />
                  )}
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </tbody>
  );
}

function EditPanel({
  row,
  branches,
  employees,
  dateFormat,
  t,
}: {
  row: MemberRow;
  branches: Branch[];
  employees: Employee[];
  dateFormat: DateFormat;
  t: Dict;
}) {
  const member = row.member;

  return (
    <div className="grid gap-6">
      {/* Photo upload — client component, independent of the form */}
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.photo}</p>
        <MemberPhotoUpload memberId={member.id} currentPhotoUrl={row.photoUrl} apiBaseUrl={apiBaseUrl} />
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6">
        <form action={updateMemberAction} className="grid gap-6">
          <input type="hidden" name="memberId" value={member.id} />

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand mb-4">{t.members.basicInfo}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={`fullName-${member.id}`} className="text-sm font-medium">
                    {t.members.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input id={`fullName-${member.id}`} name="fullName" required defaultValue={member.fullName} className={inputCls} />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={`address-${member.id}`} className="text-sm font-medium">{t.members.address}</label>
                  <input id={`address-${member.id}`} name="address" defaultValue={member.address} placeholder="e.g. Al-Irsal St, Ramallah" className={inputCls} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={`sex-${member.id}`} className="text-sm font-medium">{t.members.sex}</label>
                <select id={`sex-${member.id}`} name="sex" defaultValue={member.sex ?? ""} className={inputCls}>
                  <option value="">—</option>
                  <option value="male">{t.members.male}</option>
                  <option value="female">{t.members.female}</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={`idNumber-${member.id}`} className="text-sm font-medium">{t.members.idNumber}</label>
                <input id={`idNumber-${member.id}`} name="idNumber" defaultValue={member.idNumber} placeholder="e.g. 123456789" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={`phone-${member.id}`} className="text-sm font-medium">{t.members.phone}</label>
                <input id={`phone-${member.id}`} name="phone" type="tel" defaultValue={member.phone} placeholder="e.g. +970-59-000-0000" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={`email-${member.id}`} className="text-sm font-medium">{t.members.email}</label>
                <input id={`email-${member.id}`} name="email" type="email" defaultValue={member.email} placeholder="e.g. lina@example.com" className={inputCls} />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={`dateOfBirth-${member.id}`} className="text-sm font-medium">{t.members.dateOfBirth}</label>
                <DateInput id={`dateOfBirth-${member.id}`} name="dateOfBirth" dateFormat={dateFormat} defaultValue={member.dateOfBirth} />
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">{t.members.joinDate}</label>
                <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-foreground/60">
                  {formatDate(member.joinDate, dateFormat)}
                </p>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor={`height-${member.id}`} className="text-sm font-medium">{t.members.height}</label>
                <input
                  id={`height-${member.id}`}
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
                <label htmlFor={`weight-${member.id}`} className="text-sm font-medium">{t.members.weight}</label>
                <input
                  id={`weight-${member.id}`}
                  name="weight"
                  type="number"
                  min="20"
                  max="300"
                  defaultValue={member.weight ?? ""}
                  placeholder="e.g. 75"
                  className={inputCls}
                />
              </div>

              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor={`homeBranchId-${member.id}`} className="text-sm font-medium">{t.members.homeBranch}</label>
                  <select id={`homeBranchId-${member.id}`} name="homeBranchId" defaultValue={member.homeBranchId} className={inputCls}>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor={`registeredEmployeeId-${member.id}`} className="text-sm font-medium">{t.members.registeredEmployee}</label>
                  <select
                    id={`registeredEmployeeId-${member.id}`}
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent mb-4">{t.members.emergencyContact}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor={`emergencyContactName-${member.id}`} className="text-sm font-medium">{t.members.contactName}</label>
                <input id={`emergencyContactName-${member.id}`} name="emergencyContactName" defaultValue={member.emergencyContactName} placeholder="e.g. Ahmad Khalil" className={inputCls} />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`emergencyContactPhone-${member.id}`} className="text-sm font-medium">{t.members.contactPhone}</label>
                <input id={`emergencyContactPhone-${member.id}`} name="emergencyContactPhone" type="tel" defaultValue={member.emergencyContactPhone} placeholder="e.g. +970-59-000-0000" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Medical Notes */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50 mb-4">{t.members.medicalNotes}</p>
            <div className="grid gap-1.5">
              <label htmlFor={`medicalNotes-${member.id}`} className="text-sm font-medium">{t.members.notes}</label>
              <textarea
                id={`medicalNotes-${member.id}`}
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
              <label htmlFor={`rfidTag-${member.id}`} className="text-sm font-medium">RFID Tag ID</label>
              <input
                id={`rfidTag-${member.id}`}
                name="rfidTag"
                defaultValue={member.rfidTag}
                placeholder="e.g. A3F20C1D"
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-mono uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <p className="text-xs text-foreground/50">Scan or type the tag ID printed on the member's RFID card.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<PencilLine className="h-4 w-4" strokeWidth={2} />}>
              {t.actions.saveChanges}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
