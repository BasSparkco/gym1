import { getMember, getMemberPhotoUrl } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { listPaymentsForMember } from "@/lib/payments";
import { listBranches } from "@/lib/branches";
import { listEmployees } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatDate } from "@/lib/date-format";
import Link from "next/link";
import { PhoneNumber } from "@/components/phone-number";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import {
  PencilLine,
  QrCode,
  Wallet,
  CreditCard,
  RefreshCw,
  Snowflake,
  PlayCircle,
  ArrowLeft,
  PlusCircle,
  LogIn,
} from "lucide-react";

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

type Props = { params: Promise<{ memberId: string }> };

/** Arabic/Hebrew script ranges — used to isolate direction on individual
 * data values (names, addresses) independent of the page's own UI language. */
function isRtlText(text: string | null | undefined): boolean {
  if (!text) return false;
  return /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(text);
}

function computeAge(dobStr: string | undefined): number | null {
  if (!dobStr) return null;
  const dob = new Date(`${dobStr}T00:00:00`);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function computeBmi(heightCm: number | undefined, weightKg: number | undefined): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const pillTone: Record<string, string> = {
  active: "bg-[rgba(201,242,75,0.16)] text-[#3E6B12] ring-1 ring-inset ring-[rgba(137,179,42,0.4)]",
  paid: "bg-[rgba(201,242,75,0.16)] text-[#3E6B12] ring-1 ring-inset ring-[rgba(137,179,42,0.4)]",
  frozen: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  draft: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  expired: "bg-[#ECEFE9] text-[#5C6B64] ring-1 ring-inset ring-[#DDE3DA]",
  refunded: "bg-[#ECEFE9] text-[#5C6B64] ring-1 ring-inset ring-[#DDE3DA]",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  failed: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};
const defaultPillTone = "bg-[#ECEFE9] text-[#5C6B64] ring-1 ring-inset ring-[#DDE3DA]";

const sectionHead = "text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2C5A4E]";
const fieldKey = "text-[11px] font-medium uppercase tracking-[0.1em] text-[#5C6B64]";
const fieldValue = "text-[15px] font-semibold [overflow-wrap:anywhere]";
const railBtn =
  "inline-flex items-center gap-2 rounded-[10px] border border-[#DDE3DA] bg-[#FAFBF7] px-[18px] py-[9px] text-[13px] font-semibold text-[#16211D] transition-colors hover:border-[#2C5A4E] hover:text-[#2C5A4E]";
const panelBtnSm =
  "inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-[#DDE3DA] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#16211D] transition-colors hover:border-[#2C5A4E] hover:text-[#2C5A4E]";

export default async function MemberProfilePage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships, payments, branches, employees, settings] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
    listPaymentsForMember(memberId),
    listBranches(),
    listEmployees(),
    getSettings(),
  ]);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const homeBranch = branches.find((b) => b.id === member.homeBranchId);
  const currencySymbol = getCurrencySymbol(homeBranch?.operatingCurrencyCode);
  const registeredEmployee = employees.find((e) => e.id === member.registeredEmployeeId);
  const photoUrl = getMemberPhotoUrl(member.pictureUrl);

  const activeMembership = memberships.find((ms) => ms.status === "active");
  const frozenMembership = memberships.find((ms) => ms.status === "frozen");

  const age = computeAge(member.dateOfBirth);
  const bmi = computeBmi(member.height, member.weight);
  const todayStr = new Date().toISOString().slice(0, 10);

  const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
      active: t.status.active,
      inactive: t.status.inactive,
      frozen: t.status.frozen,
      expired: t.status.expired,
      cancelled: t.status.cancelled,
      draft: t.status.draft,
      paid: t.status.paid,
      pending: t.status.pending,
      failed: t.status.failed,
      refunded: t.status.refunded,
    };
    return map[status] ?? status;
  };

  return (
    <div className={archivo.className}>
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <nav
          aria-label="Breadcrumb"
          className={`${plexMono.className} flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-[#5C6B64]`}
        >
          <Link href="/app/members" className="text-[#2C5A4E] hover:underline">
            {t.nav.members}
          </Link>
          <span className="text-[#DDE3DA]">/</span>
          <span>{member.memberNumber}</span>
        </nav>
        <Link
          href="/app/members"
          className="inline-flex items-center gap-2 rounded-[10px] border border-[#DDE3DA] bg-[#FAFBF7] px-4 py-2 text-[13px] font-semibold text-[#2C5A4E] transition-colors hover:border-[#2C5A4E]"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          {t.members.allMembers}
        </Link>
      </div>

      {/* Member card */}
      <header className="relative overflow-hidden rounded-[18px] bg-[#0C2B24] text-[#F2F6EF] shadow-[0_24px_48px_-24px_rgba(12,43,36,0.45)]">
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_90px,rgba(255,255,255,0.028)_90px_92px)]" />

        <div className="relative flex flex-wrap items-center gap-7 px-9 py-8">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="h-24 w-24 shrink-0 rounded-2xl border border-white/15 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[linear-gradient(145deg,#2C5A4E,#123A31)] text-[34px] font-extrabold text-[#C9F24B]">
              {initials(member.fullName)}
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
                className={`${plexMono.className} inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${
                  member.status === "active" ? "border-[rgba(201,242,75,0.35)] text-[#C9F24B]" : "border-white/25 text-white/60"
                }`}
              >
                <span
                  className={`h-[7px] w-[7px] rounded-full ${
                    member.status === "active"
                      ? "bg-[#C9F24B] shadow-[0_0_0_3px_rgba(201,242,75,0.18)] motion-safe:animate-pulse"
                      : "bg-white/40"
                  }`}
                />
                {member.status === "active" ? t.status.active : t.status.inactive}
              </span>
              {homeBranch && (
                <span
                  className={`${plexMono.className} rounded-full border border-white/16 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/75`}
                >
                  {homeBranch.name}
                </span>
              )}
              <span className={`${plexMono.className} text-[12px] tracking-[0.14em] text-white/65`}>
                {member.memberNumber}
              </span>
            </div>
          </div>

          {member.rfidTag && (
            <div className="flex shrink-0 flex-col items-end gap-2 text-right">
              <div className="relative h-[38px] w-[52px] rounded-lg bg-[linear-gradient(140deg,#E8D98A,#C9AF5B_55%,#EADFA4)] before:absolute before:inset-x-0 before:top-3 before:h-px before:bg-[rgba(60,45,10,0.35)] after:absolute after:inset-x-0 after:bottom-3 after:h-px after:bg-[rgba(60,45,10,0.35)]" />
              <span className={`${plexMono.className} text-[12px] tracking-[0.22em] text-[#C9F24B]`}>
                {member.rfidTag}
              </span>
              <span className={`${plexMono.className} text-[10px] uppercase tracking-[0.18em] text-white/50`}>
                {t.members.rfidTagLabel}
              </span>
            </div>
          )}
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/12 px-9 py-3.5">
          <div className="flex flex-wrap gap-7">
            {member.joinDate && (
              <div className="flex flex-col gap-0.5">
                <span className={`${plexMono.className} text-[10px] uppercase tracking-[0.16em] text-white/50`}>
                  {t.members.memberSince}
                </span>
                <span className="text-[14px] font-semibold text-[#F2F6EF]">
                  {formatDate(member.joinDate, dateFormat)}
                </span>
              </div>
            )}
            {age !== null && (
              <div className="flex flex-col gap-0.5">
                <span className={`${plexMono.className} text-[10px] uppercase tracking-[0.16em] text-white/50`}>
                  {t.members.age}
                </span>
                <span className="text-[14px] font-semibold text-[#F2F6EF]">{age}</span>
              </div>
            )}
            {registeredEmployee && (
              <div className="flex flex-col gap-0.5">
                <span className={`${plexMono.className} text-[10px] uppercase tracking-[0.16em] text-white/50`}>
                  {t.members.registeredEmployee}
                </span>
                <span
                  dir={isRtlText(registeredEmployee.fullName) ? "rtl" : undefined}
                  className="text-[14px] font-semibold text-[#F2F6EF]"
                >
                  {registeredEmployee.fullName}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2.5">
            <Link
              href={`/app/members/${member.id}/edit`}
              className="inline-flex items-center gap-2 rounded-[10px] border border-white/25 px-[18px] py-[9px] text-[13px] font-semibold text-[#F2F6EF] transition-colors hover:border-white/50"
            >
              <PencilLine className="h-3.5 w-3.5" strokeWidth={2.2} />
              {t.members.editDetails}
            </Link>
            <Link
              href="/app/check-in"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#C9F24B] px-[18px] py-[9px] text-[13px] font-semibold text-[#0C2B24] transition-colors hover:bg-[#D6F86A]"
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
        {activeMembership ? (
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
        {activeMembership && (
          <Link href={`/app/members/${member.id}/freeze`} className={railBtn}>
            <Snowflake className="h-3.5 w-3.5" strokeWidth={2} />
            {t.members.freezeMembership}
          </Link>
        )}
        {frozenMembership && (
          <Link href={`/app/members/${member.id}/unfreeze`} className={railBtn}>
            <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
            {t.members.reactivateMembership}
          </Link>
        )}
      </div>

      {/* Details grid */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* Identity + Contact */}
        <section className="rounded-[18px] border border-[#DDE3DA] bg-[#FAFBF7] px-7 py-6">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className={`${plexMono.className} ${sectionHead}`}>{t.members.identityTitle}</h2>
            <span className="h-px flex-1 bg-[#DDE3DA]" />
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
                <span className={`${fieldValue} capitalize`}>
                  {member.sex === "male" ? t.members.male : t.members.female}
                </span>
              </div>
            )}
            {member.dateOfBirth && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.dateOfBirth}</span>
                <span className={fieldValue}>
                  {formatDate(member.dateOfBirth, dateFormat)}
                  {age !== null && (
                    <span className="ms-1 text-[12px] font-normal text-[#5C6B64]">
                      · {formatDict(t.members.ageYears, { count: age })}
                    </span>
                  )}
                </span>
              </div>
            )}
            {member.idNumber && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.idNumber}</span>
                <span className={`${plexMono.className} text-[14px] font-medium tracking-[0.06em]`}>
                  {member.idNumber}
                </span>
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
            <h2 className={`${plexMono.className} ${sectionHead}`}>{t.members.contactTitle}</h2>
            <span className="h-px flex-1 bg-[#DDE3DA]" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {member.phone && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.phone}</span>
                <a
                  href={`tel:${member.phone}`}
                  className={`${plexMono.className} text-[14px] font-medium text-[#2C5A4E] hover:underline`}
                >
                  <PhoneNumber value={member.phone} />
                </a>
              </div>
            )}
            {member.email && (
              <div className="flex flex-col gap-1">
                <span className={fieldKey}>{t.members.email}</span>
                <a
                  href={`mailto:${member.email}`}
                  className={`${plexMono.className} break-all text-[14px] font-medium text-[#2C5A4E] hover:underline`}
                >
                  {member.email}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Emergency contact + Physical profile */}
        <section className="rounded-[18px] border border-[#DDE3DA] bg-[#FAFBF7] px-7 py-6">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className={`${plexMono.className} ${sectionHead}`}>{t.members.emergencyContact}</h2>
            <span className="h-px flex-1 bg-[#DDE3DA]" />
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
                  <span className={`${plexMono.className} text-[14px] font-medium`}>
                    <PhoneNumber value={member.emergencyContactPhone} />
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#DDE3DA] bg-[#ECEFE9] px-5 py-5">
              <p className="text-[13px] text-[#5C6B64]">{t.members.noEmergencyContactLong}</p>
              <Link href={`/app/members/${member.id}/edit`} className={panelBtnSm}>
                <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
                {t.members.addEmergencyContact}
              </Link>
            </div>
          )}

          {member.medicalNotes && (
            <>
              <div className="mb-3 mt-6 flex items-center gap-2.5">
                <h2 className={`${plexMono.className} text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5C6B64]`}>
                  {t.members.medicalNotes}
                </h2>
                <span className="h-px flex-1 bg-[#DDE3DA]" />
              </div>
              <p className="text-[14px] leading-6 text-[#16211D]/80">{member.medicalNotes}</p>
            </>
          )}

          {(member.height || member.weight) && (
            <>
              <div className="mb-4 mt-6 flex items-center gap-2.5">
                <h2 className={`${plexMono.className} ${sectionHead}`}>{t.members.physicalProfileTitle}</h2>
                <span className="h-px flex-1 bg-[#DDE3DA]" />
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                {member.height && (
                  <div className="rounded-xl border border-[#DDE3DA] bg-[#ECEFE9] px-4 py-3.5">
                    <div className="text-[24px] font-extrabold leading-none" style={{ fontVariationSettings: '"wdth" 110' }}>
                      {member.height}
                      <small className="ms-1 text-[12px] font-semibold text-[#5C6B64]">cm</small>
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-[#5C6B64]">
                      {t.members.heightStat}
                    </div>
                  </div>
                )}
                {member.weight && (
                  <div className="rounded-xl border border-[#DDE3DA] bg-[#ECEFE9] px-4 py-3.5">
                    <div className="text-[24px] font-extrabold leading-none" style={{ fontVariationSettings: '"wdth" 110' }}>
                      {member.weight}
                      <small className="ms-1 text-[12px] font-semibold text-[#5C6B64]">kg</small>
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-[#5C6B64]">
                      {t.members.weightStat}
                    </div>
                  </div>
                )}
                {bmi !== null && (
                  <div className="rounded-xl border border-[#DDE3DA] bg-[#ECEFE9] px-4 py-3.5">
                    <div className="text-[24px] font-extrabold leading-none" style={{ fontVariationSettings: '"wdth" 110' }}>
                      {bmi}
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-[#5C6B64]">{t.members.bmi}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Memberships */}
        <section className="rounded-[18px] border border-[#DDE3DA] bg-[#FAFBF7] px-7 py-6 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <h2 className={`${plexMono.className} ${sectionHead}`}>{t.members.memberships}</h2>
            <span className="h-px flex-1 bg-[#DDE3DA]" />
            <Link href={`/app/members/${member.id}/memberships/new`} className={panelBtnSm}>
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {t.members.sellMembership}
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#DDE3DA] bg-[#ECEFE9] px-5 py-5">
              <p className="text-[13px] text-[#5C6B64]">{t.members.noMembershipsYet}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5">
              {memberships
                .slice()
                .sort((a, b) => b.startDate.localeCompare(a.startDate))
                .map((ms) => {
                  const isActiveMs = ms.status === "active";
                  const totalDays = daysBetween(ms.startDate, ms.endDate);
                  const remainingDays = Math.max(0, daysBetween(todayStr, ms.endDate));
                  const pct = totalDays > 0 ? Math.max(0, Math.min(100, Math.round((remainingDays / totalDays) * 100))) : 0;

                  return (
                    <div
                      key={ms.id}
                      className="flex flex-wrap items-center gap-4 rounded-xl border border-[#DDE3DA] bg-white px-4 py-4"
                    >
                      <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                        <span dir={isRtlText(ms.plan?.name) ? "rtl" : undefined} className="text-[15px] font-semibold">
                          {ms.plan?.name ?? ms.planId}
                        </span>
                        <span className={`${plexMono.className} text-[12px] tracking-[0.04em] text-[#5C6B64]`}>
                          {formatDate(ms.startDate, dateFormat)} → {formatDate(ms.endDate, dateFormat)}
                        </span>
                      </div>
                      {isActiveMs && (
                        <div className="w-[120px] shrink-0">
                          <div className="h-[5px] overflow-hidden rounded-full bg-[#DDE3DA]">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#2C5A4E,#7CAF23)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className={`${plexMono.className} mt-1.5 text-[10px] uppercase tracking-[0.1em] text-[#5C6B64]`}>
                            {formatDict(
                              remainingDays === 1 ? t.members.daysLeftSingular : t.members.daysLeftPlural,
                              { count: remainingDays },
                            )}
                          </div>
                        </div>
                      )}
                      <span className={`${plexMono.className} text-[15px] font-semibold`}>
                        {currencySymbol}
                        {ms.finalPrice}
                      </span>
                      <span
                        className={`${plexMono.className} inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[10px] uppercase tracking-[0.14em] ${pillTone[ms.status] ?? defaultPillTone}`}
                      >
                        {isActiveMs && <span className="h-[6px] w-[6px] rounded-full bg-[#7CAF23]" />}
                        {statusLabel(ms.status)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Payments */}
        <section className="rounded-[18px] border border-[#DDE3DA] bg-[#FAFBF7] px-7 py-6 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <h2 className={`${plexMono.className} ${sectionHead}`}>{t.members.payments}</h2>
            <span className="h-px flex-1 bg-[#DDE3DA]" />
            <Link href={`/app/members/${member.id}/payments/new`} className={panelBtnSm}>
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={2} />
              {t.members.recordPayment}
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-dashed border-[#DDE3DA] bg-[#ECEFE9] px-5 py-5">
              <p className="text-[13px] text-[#5C6B64]">{t.payments.noPayments}</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5">
              {payments
                .slice()
                .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                .map((pmt) => (
                  <div
                    key={pmt.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border border-[#DDE3DA] bg-white px-4 py-4"
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-2.5">
                      <span className={`${plexMono.className} text-[15px] font-semibold`}>
                        {currencySymbol}
                        {pmt.amount}
                      </span>
                      <span className="text-[13px] capitalize text-[#5C6B64]">{pmt.paymentMethod}</span>
                      <span className={`${plexMono.className} text-[12px] text-[#5C6B64]/70`}>
                        {formatDate(pmt.paymentDate, dateFormat)}
                      </span>
                    </div>
                    <span
                      className={`${plexMono.className} inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[10px] uppercase tracking-[0.14em] ${pillTone[pmt.status] ?? defaultPillTone}`}
                    >
                      {statusLabel(pmt.status)}
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
