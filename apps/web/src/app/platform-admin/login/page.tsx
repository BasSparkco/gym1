import { PlatformAdminSignInForm } from "@/components/platform-admin/sign-in-form";
import { getPlatformAdminSession } from "@/lib/platform-admin";
import { redirect } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PlatformAdminLoginPage() {
  const admin = await getPlatformAdminSession();

  if (admin) {
    redirect("/platform-admin");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_var(--surface-muted),_var(--background)_55%,_var(--line))] px-6 py-10 text-foreground">
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <section className="w-full animate-fade-in-up rounded-[2rem] border border-line bg-surface p-8 shadow-[0_20px_80px_rgba(var(--shadow-tint),0.1)]">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Platform Admin
          </p>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight">
            Operator sign-in
          </h1>
          <p className="mt-4 text-sm leading-7 text-foreground/70">
            Onboarding console for creating new tenants. Not part of any gym's
            own login.
          </p>

          <PlatformAdminSignInForm />
        </section>
      </div>
    </main>
  );
}
