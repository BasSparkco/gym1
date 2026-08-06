import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { BarChart3, CreditCard, Dumbbell, ScanLine } from "lucide-react";

export default async function SignInPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app/dashboard");
  }

  const t = await getT();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_var(--surface-muted),_var(--background)_55%,_var(--line))] px-6 py-10 text-foreground">
      {/* Decorative glow accents */}
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="animate-fade-in-up relative overflow-hidden rounded-[2rem] border border-line bg-brand-strong p-8 text-white lg:p-12">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white/10 ring-1 ring-accent/25">
              <Dumbbell className="h-5 w-5 text-accent" strokeWidth={2} />
            </div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Spark Gym ERP
            </p>
          </div>

          <h1 className="font-display relative mt-6 max-w-xl text-4xl font-bold tracking-tight lg:text-6xl">
            Daily operations for gyms, built around the front desk.
          </h1>
          <p className="relative mt-6 max-w-xl text-base leading-8 text-white/75 lg:text-lg">
            Start with memberships, payments, visit validation, and reporting. Expand later into devices, commerce, mobile, and automation.
          </p>

          <div className="relative mt-10 grid gap-4 md:grid-cols-3">
            <div className="group rounded-3xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15">
              <CreditCard className="h-5 w-5 text-white/70 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
              <p className="mt-3 text-sm text-white/65">{t.auth.mvpFocus}</p>
              <p className="mt-1 text-xl font-semibold">{t.nav.membershipPlans}</p>
            </div>
            <div className="group rounded-3xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15">
              <ScanLine className="h-5 w-5 text-white/70 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
              <p className="mt-3 text-sm text-white/65">{t.auth.access}</p>
              <p className="mt-1 text-xl font-semibold">QR + Manual</p>
            </div>
            <div className="group rounded-3xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15">
              <BarChart3 className="h-5 w-5 text-white/70 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
              <p className="mt-3 text-sm text-white/65">{t.auth.reporting}</p>
              <p className="mt-1 text-xl font-semibold">{t.reports.title}</p>
            </div>
          </div>
        </section>

        <section className="animate-fade-in-up stagger-2 rounded-[2rem] border border-line bg-surface p-8 shadow-[0_20px_80px_rgba(var(--shadow-tint),0.1)] lg:p-10">
          <div className="max-w-md">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              {t.auth.signIn}
            </p>
            <h2 className="font-display mt-4 text-3xl font-bold tracking-tight">
              {t.auth.accessConsole}
            </h2>
            <p className="mt-4 text-sm leading-7 text-foreground/70">
              {t.auth.signInDescription}
            </p>
          </div>

          <SignInForm
            labels={{
              email: t.auth.email,
              password: t.auth.password,
              continue: t.auth.continue,
              signingIn: t.auth.signingIn,
            }}
            pilotCredentialsLabel={t.auth.pilotCredentials}
            pilotCredentialsHint={t.auth.pilotCredentialsHint}
            pilotAccounts={[
              { roleLabel: t.roles.owner, email: "owner@sparkgym.local", password: "Owner@Spark2026" },
              { roleLabel: t.roles.frontDesk, email: "frontdesk@sparkgym.local", password: "Desk@Spark2026" },
            ]}
          />
        </section>
      </div>
    </main>
  );
}
