import type { Dict } from "@/lib/i18n";

/** Arabic/Hebrew script ranges — used to isolate direction on individual
 * data values (names, addresses) independent of the page's own UI language. */
export function isRtlText(text: string | null | undefined): boolean {
  if (!text) return false;
  return /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(text);
}

export function computeAge(dobStr: string | undefined): number | null {
  if (!dobStr) return null;
  const dob = new Date(`${dobStr}T00:00:00`);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function computeBmi(heightCm: number | undefined, weightKg: number | undefined): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function statusLabel(t: Dict, status: string): string {
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
}

export const pillTone: Record<string, string> = {
  active: "bg-[rgba(201,242,75,0.16)] text-accent-ink ring-1 ring-inset ring-[rgba(137,179,42,0.4)]",
  paid: "bg-[rgba(201,242,75,0.16)] text-accent-ink ring-1 ring-inset ring-[rgba(137,179,42,0.4)]",
  frozen: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  draft: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  expired: "bg-surface-muted text-muted ring-1 ring-inset ring-line",
  refunded: "bg-surface-muted text-muted ring-1 ring-inset ring-line",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  failed: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};
export const defaultPillTone = "bg-surface-muted text-muted ring-1 ring-inset ring-line";

export const sectionHead = "text-[11px] font-semibold uppercase tracking-[0.22em] text-brand";
export const fieldKey = "text-[11px] font-medium uppercase tracking-[0.1em] text-muted";
export const fieldValue = "text-[15px] font-semibold [overflow-wrap:anywhere]";
export const railBtn =
  "inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-[18px] py-[9px] text-[13px] font-semibold text-foreground transition-colors hover:border-brand hover:text-brand";
export const panelBtnSm =
  "inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-line bg-white px-3.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:border-brand hover:text-brand";
