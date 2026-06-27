import type { DateFormat } from "@/lib/settings";

export function formatDateLong(dateStr: string | undefined | null, locale = "en"): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(d);
}

export function formatDate(dateStr: string | undefined | null, fmt: DateFormat): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return fmt === "dd/mm/yyyy"
    ? `${day}/${month}/${year}`
    : `${month}/${day}/${year}`;
}

export function formatDateTime(isoStr: string | undefined | null, fmt: DateFormat): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const datePart = fmt === "dd/mm/yyyy"
    ? `${day}/${month}/${year}`
    : `${month}/${day}/${year}`;
  return `${datePart} ${hours}:${minutes}`;
}
