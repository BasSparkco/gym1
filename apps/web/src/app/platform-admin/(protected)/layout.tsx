import { requirePlatformAdminSession } from "@/lib/platform-admin";
import { PlatformAdminSignOutButton } from "@/components/platform-admin/sign-out-button";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdminSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Platform Admin
          </p>
          <PlatformAdminSignOutButton name={admin.name} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
