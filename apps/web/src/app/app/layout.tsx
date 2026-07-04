import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const t = await getT();
  const viewingAllBranches =
    session.role === "owner" &&
    (await getSettings()).ownerDataScope === "all";

  return (
    <AppShell user={session} t={t} viewingAllBranches={viewingAllBranches}>
      {children}
    </AppShell>
  );
}
