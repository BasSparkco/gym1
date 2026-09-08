// No "server-only" here deliberately — lib/i18n.ts re-exports this for its
// (server-only) callers, but client components that need to format an
// already-fetched translation template (e.g. a plan's "{count} day{plural}"
// unit label) import it directly from here instead.
export function formatDict(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), template);
}
