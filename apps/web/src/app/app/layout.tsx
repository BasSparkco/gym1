import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings, getLogoUrl } from "@/lib/settings";
import { getBranch } from "@/lib/branches";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const t = await getT();
  const settings = await getSettings();
  const viewingAllBranches =
    session.role === "owner" && settings.ownerDataScope === "all";

  const logoUrl =
    settings.logoMode === "perBranch"
      ? getLogoUrl((await getBranch(session.branch.id)).logoUrl)
      : getLogoUrl(settings.logoUrl);

  return (
    <AppShell user={session} t={t} viewingAllBranches={viewingAllBranches} logoUrl={logoUrl}>
      {children}
    </AppShell>
  );
}
