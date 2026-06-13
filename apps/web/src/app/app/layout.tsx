import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const t = await getT();

  return <AppShell user={session} t={t}>{children}</AppShell>;
}
