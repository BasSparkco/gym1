"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneNumber } from "@/components/phone-number";
import DateInput from "@/components/date-input";
import MemberPhotoUpload from "@/components/members/member-photo-upload";
import { updateMemberAction } from "@/app/app/members/actions";
import { apiBaseUrl } from "@/lib/auth";
import type { Member } from "@/lib/members";
import type { Branch } from "@/lib/branches";
import type { Employee } from "@/lib/employees";
import type { DateFormat } from "@/lib/settings";
import type { Dict } from "@/lib/i18n";
import type { BadgeTone } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-format";
import {
  isRtlText,
  daysBetween,
  statusLabel,
  pillTone,
  defaultPillTone,
  sectionHead,
  fieldKey,
  fieldValue,
  railBtn,
  panelBtnSm,
} from "@/components/members/member-profile-shared";
import {
  PencilLine,
  QrCode,
  Wallet,
  CreditCard,
  RefreshCw,
  Snowflake,
  PlayCircle,
  PlusCircle,
  LogIn,
} from "lucide-react";

export type MembershipRow = {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  finalPrice: number;
};

export type PaymentRow = {
  id: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentMethod: string;
};

export type MemberRow = {
  member: Member;
  avatar: string;
  photoUrl: string | null;
  planBadge?: string;
  branchName: string;
  expiresText: string;
  expiryColorClass: string;
  statusTone: BadgeTone;
  statusLabelText: string;
  currencySymbol: string;
  registeredEmployeeName?: string;
  age: number | null;
  bmi: number | null;
  memberships: MembershipRow[];
  payments: PaymentRow[];
  hasActiveMembership: boolean;
  hasFrozenMembership: boolean;
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
              <td className="py-3 pe-4 text-start font-mono text-xs text-foreground/70">0</td>
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
                    <ProfilePanel row={row} t={t} dateFormat={dateFormat} onEditClick={() => toggleEdit(row.member.id)} />
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

function ProfilePanel({
  row,
  t,
  dateFormat,
  onEditClick,
}: {
  row: MemberRow;
  t: Dict;
  dateFormat: DateFormat;
  onEditClick: () => void;
}) {
  const member = row.member;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="font-display">
      {/* Member card */}
      <header className="relative overflow-hidden rounded-[18px] bg-brand-strong text-on-brand shadow-[0_24px_48px_-24px_rgba(var(--shadow-tint),0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_90px,rgba(255,255,255,0.028)_90px_92px)]" />

        <div className="relative flex flex-wrap items-center gap-7 px-9 py-8">
          {row.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.photoUrl}
              alt=""
              className="h-24 w-24 shrink-0 rounded-2xl border border-white/15 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(145deg,var(--brand),var(--brand-deeper))] text-[34px] font-extrabold text-accent">
              {row.avatar}
            </div>
          )}

          <div className="min-w-[220px] flex-1">
            <h1
              dir={isRtlText(member.fullName) ? "rtl" : undefined}
              className="text-[clamp(24px,4vw,36px)] font-extrabold uppercase leading-[1.05] tracking-[0.015em]"
              style={{ fontVariationSettings: '"wdth" 118' }}
            >
              {member.fullName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span
                className={`font-mono inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                  member.status === "active" ? "border-[rgba(201,242,75,0.35)] text-accent" : "border-white/25 text-white/60"
                }`}
              >
                <span
                  className={`h-[7px] w-[7px] rounded-full ${
                    member.status === "active"
                      ? "bg-accent shadow-[0_0_0_3px_rgba(201,242,75,0.18)] motion-safe:animate-pulse"
                      : "bg-white/40"
                  }`}
                />
                {member.status === "active" ? t.status.active : t.status.inactive}
              </span>
              <span className={`font-mono rounded-full border border-white/16 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/75`}>
                {row.branchName}
              </span>
              <span className={`font-mono text-[12px] tracking-[0.14em] text-white/65`}>{member.memberNumber}</span>
            </div>
          </div>

          {member.rfidTag && (
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <div className="relative h-[38px] w-[52px] rounded-lg bg-[linear-gradient(140deg,#E8D98A,#C9AF5B_55%,#EADFA4)] before:absolute before:inset-x-0 before:top-3 before:h-px before:bg-[rgba(60,45,10,0.35)] after:absolute after:inset-x-0 after:bottom-3 after:h-px after:bg-[rgba(60,45,10,0.35)]" />
              <span className={`font-mono text-[12px] tracking-[0.22em] text-accent`}>{member.rfidTag}</span>
              <span className={`font-mono text-[10px] uppercase tracking-[0.18em] text-white/50`}>{t.members.rfidTagLabel}</span>
            </div>
          )}
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/12 px-9 py-3.5">
          <div className="flex flex-wrap gap-7">
            {member.joinDate && (
              <div className="flex flex-col gap-0.5">
                <span className={`font-mono text-[10px] uppercase tracking-[0.16em] text-white/50`}>{t.members.memberSince}</span>
                <span className="text-[14px] font-semibold text-on-brand">{formatDate(member.joinDate, dateFormat)}</span>
              </div>
            )}
            {row.age !== null && (
              <div className="flex flex-col gap-0.5">
                <span className={`font-mono text-[10px] uppercase tracking-[0.16em] text-white/50`}>{t.members.age}</span>
                <span className="text-[14px] font-semibold text-on-brand">{row.age}</span>
              </div>
            )}
            {row.registeredEmployeeName && (
              <div className="flex flex-col gap-0.5">
                <span className={`font-mono text-[10px] uppercase tracking-[0.16em] text-white/50`}>{t.members.registeredEmployee}</span>
                <span dir={isRtlText(row.registeredEmployeeName) ? "rtl" : undefined} className="text-[14px] font-semibold text-on-brand">
                  {row.registeredEmployeeName}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 px-[18px] py-[9px] text-[13px] font-semibold text-on-brand transition-colors hover:border-white/50"
            >
              <PencilLine className="h-3.5 w-3.5" strokeWidth={2.2} />
              {t.members.editDetails}
            </button>
            <Link
              href="/app/check-in"
              className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-[18px] py-[9px] text-[13px] font-semibold text-brand-strong transition-colors hover:bg-accent-strong"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={2.2} />
              {t.nav.checkIn}
            </Link>
          </div>
        </div>
      </header>

      {/* Quick actions rail */}
      <div role="toolbar" aria-label={t.members.quickActions} className="mt-5 flex flex-wrap gap-2.5">
        <Link href={`/app/members/${member.id}/qr`} className={railBtn}>
          <QrCode className="h-3.5 w-3.5" strokeWidth={2} />
          {t.members.showQrCode}
        </Link>
        {row.hasActiveMembership ? (
          <Link href={`/app/members/${member.id}/payments/new`} className={railBtn}>
            <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
            {t.members.recordPayment}
          </Link>
        ) : (
          <Link href={`/app/members/${member.id}/memberships/new`} className={railBtn}>
            <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
            {t.members.sellMembership}
          </Link>
        )}
        <Link href={`/app/members/${member.id}/renew`} className={railBtn}>
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          {t.members.renewMembership}
        </Link>
        {row.hasActiveMembership && (
          <Link href={`/app/members/${member.id}/freeze`} className={railBtn}>
            <Snowflake className="h-3.5 w-3.5" strokeWidth={2} />
            {t.members.freezeMembership}
          </Link>
        )}
        {row.hasFrozenMembership && (
          <Link href={`/app/members/${member.id}/unfreeze`} className={railBtn}>
            <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
            {t.members.reactivateMembership}
          </Link>
        )}
      </div>

      {/* Details grid */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Identity + Contact */}
        <section className="rounded-[18px] border border-line bg-surface px-7 py-6">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className={`font-mono ${sectionHead}`}>{t.members.identityTitle}</h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1">
              <span className={fieldKey}>{t.members.fullName}</span>
              <span dir={isRtlText(member.fullName) ? "rtl" : undefined} className={fieldValue}>
                {member.fullName}
              </span>
            </div>
            {member.sex && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.sex}</span>
                <span className={`${fieldValue} capitalize`}>{member.sex === "male" ? t.members.male : t.members.female}</span>
              </div>
            )}
            {member.dateOfBirth && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.dateOfBirth}</span>
                <span className={fieldValue}>
                  {formatDate(member.dateOfBirth, dateFormat)}
                  {row.age !== null && (
                    <span className="ms-1 text-[12px] font-normal text-muted">
                      · {t.members.ageYears.replace("{count}", String(row.age))}
                    </span>
                  )}
                </span>
              </div>
            )}
            {member.idNumber && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.idNumber}</span>
                <span className={`font-mono text-[14px] font-medium tracking-[0.06em]`}>{member.idNumber}</span>
              </div>
            )}
            {member.address && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.address}</span>
                <span dir={isRtlText(member.address) ? "rtl" : undefined} className={fieldValue}>
                  {member.address}
                </span>
              </div>
            )}
          </div>

          <div className="mb-4 mt-6 flex items-center gap-2.5">
            <h2 className={`font-mono ${sectionHead}`}>{t.members.contactTitle}</h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {member.phone && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.phone}</span>
                <a href={`tel:${member.phone}`} className={`font-mono text-[14px] font-medium text-brand hover:underline`}>
                  <PhoneNumber value={member.phone} />
                </a>
              </div>
            )}
            {member.email && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.email}</span>
                <a href={`mailto:${member.email}`} className={`font-mono break-all text-[14px] font-medium text-brand hover:underline`}>
                  {member.email}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Emergency contact + Physical profile */}
        <section className="rounded-[18px] border border-line bg-surface px-7 py-6">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className={`font-mono ${sectionHead}`}>{t.members.emergencyContact}</h2>
            <span className="h-px flex-1 bg-line" />
          </div>
          {member.emergencyContactName || member.emergencyContactPhone ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {member.emergencyContactName && (
                <div className="flex flex-col gap-1">
                  <span className={fieldKey}>{t.members.contactName}</span>
                  <span dir={isRtlText(member.emergencyContactName) ? "rtl" : undefined} className={fieldValue}>
                    {member.emergencyContactName}
                  </span>
                </div>
              )}
              {member.emergencyContactPhone && (
                <div className="flex flex-col gap-1">
                  <span className={fieldKey}>{t.members.phone}</span>
                  <span className={`font-mono text-[14px] font-medium`}>
                    <PhoneNumber value={member.emergencyContactPhone} />
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line bg-surface-muted px-5 py-5">
              <p className="text-[13px] text-muted">{t.members.noEmergencyContactLong}</p>
              <button type="button" onClick={onEditClick} className={panelBtnSm}>
                <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
                {t.members.addEmergencyContact}
              </button>
            </div>
          )}

          {member.medicalNotes && (
            <>
              <div className="mb-3 mt-6 flex items-center gap-2.5">
                <h2 className={`font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-muted`}>{t.members.medicalNotes}</h2>
                <span className="h-px flex-1 bg-line" />
              </div>
              <p className="text-[14px] leading-6 text-foreground/80">{member.medicalNotes}</p>
            </>
          )}

          {(member.height || member.weight) && (
            <>
              <div className="mb-4 mt-6 flex items-center gap-2.5">
                <h2 className={`font-mono ${sectionHead}`}>{t.members.physicalProfileTitle}</h2>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                {member.height && (
                  <div className="rounded-xl border border-line bg-surface-muted px-4 py-3.5">
                    <div className="text-[24px] font-extrabold leading-none" style={{ fontVariationSettings: '"wdth" 110' }}>
                      {member.height}
                      <small className="ms-1 text-[12px] font-semibold text-muted">cm</small>
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">{t.members.heightStat}</div>
                  </div>
                )}
                {member.weight && (
                  <div className="rounded-xl border border-line bg-surface-muted px-4 py-3.5">
                    <div className="text-[24px] font-extrabold leading-none" style={{ fontVariationSettings: '"wdth" 110' }}>
                      {member.weight}
                      <small className="ms-1 text-[12px] font-semibold text-muted">kg</small>
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">{t.members.weightStat}</div>
                  </div>
                )}
                {row.bmi !== null && (
                  <div className="rounded-xl border border-line bg-surface-muted px-4 py-3.5">
                    <div className="text-[24px] font-extrabold leading-none" style={{ fontVariationSettings: '"wdth" 110' }}>
                      {row.bmi}
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-muted">{t.members.bmi}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Memberships */}
        <section className="rounded-[18px] border border-line bg-surface px-7 py-6 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <h2 className={`font-mono ${sectionHead}`}>{t.members.memberships}</h2>
            <span className="h-px flex-1 bg-line" />
            <Link href={`/app/members/${member.id}/memberships/new`} className={panelBtnSm}>
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {t.members.sellMembership}
            </Link>
          </div>

          {row.memberships.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-line bg-surface-muted px-5 py-5">
              <p className="text-[13px] text-muted">{t.members.noMembershipsYet}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5">
              {row.memberships.map((ms) => {
                const isActiveMs = ms.status === "active";
                const totalDays = daysBetween(ms.startDate, ms.endDate);
                const remainingDays = Math.max(0, daysBetween(todayStr, ms.endDate));
                const pct = totalDays > 0 ? Math.max(0, Math.min(100, Math.round((remainingDays / totalDays) * 100))) : 0;

                return (
                  <div key={ms.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white px-4 py-4">
                    <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                      <span dir={isRtlText(ms.planName) ? "rtl" : undefined} className="text-[15px] font-semibold">
                        {ms.planName}
                      </span>
                      <span className={`font-mono text-[12px] tracking-[0.04em] text-muted`}>
                        {formatDate(ms.startDate, dateFormat)} → {formatDate(ms.endDate, dateFormat)}
                      </span>
                    </div>
                    {isActiveMs && (
                      <div className="w-[120px] shrink-0">
                        <div className="h-[5px] overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--accent-strong))]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className={`font-mono mt-1.5 text-[10px] uppercase tracking-[0.1em] text-muted`}>
                          {(remainingDays === 1 ? t.members.daysLeftSingular : t.members.daysLeftPlural).replace(
                            "{count}",
                            String(remainingDays),
                          )}
                        </div>
                      </div>
                    )}
                    <span className={`font-mono text-[15px] font-semibold`}>
                      {row.currencySymbol}
                      {ms.finalPrice}
                    </span>
                    <span
                      className={`font-mono inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[10px] uppercase tracking-[0.14em] ${pillTone[ms.status] ?? defaultPillTone}`}
                    >
                      {isActiveMs && <span className="h-[6px] w-[6px] rounded-full bg-accent-strong" />}
                      {statusLabel(t, ms.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Payments */}
        <section className="rounded-[18px] border border-line bg-surface px-7 py-6 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <h2 className={`font-mono ${sectionHead}`}>{t.members.payments}</h2>
            <span className="h-px flex-1 bg-line" />
            <Link href={`/app/members/${member.id}/payments/new`} className={panelBtnSm}>
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {t.members.recordPayment}
            </Link>
          </div>

          {row.payments.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-line bg-surface-muted px-5 py-5">
              <p className="text-[13px] text-muted">{t.payments.noPayments}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5">
              {row.payments.map((pmt) => (
                <div key={pmt.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white px-4 py-4">
                  <div className="flex flex-1 flex-wrap items-center gap-2.5">
                    <span className={`font-mono text-[15px] font-semibold`}>
                      {row.currencySymbol}
                      {pmt.amount}
                    </span>
                    <span className="text-[13px] capitalize text-muted">{pmt.paymentMethod}</span>
                    <span className={`font-mono text-[12px] text-muted/70`}>{formatDate(pmt.paymentDate, dateFormat)}</span>
                  </div>
                  <span
                    className={`font-mono inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[10px] uppercase tracking-[0.14em] ${pillTone[pmt.status] ?? defaultPillTone}`}
                  >
                    {statusLabel(t, pmt.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
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
