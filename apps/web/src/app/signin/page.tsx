import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app/dashboard");
  }

  const t = await getT();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#efe6d7,_#f5f1e8_55%,_#eadbc2)] px-6 py-10 text-foreground">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-line bg-brand-strong p-8 text-white lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Spark Gym ERP
          </p>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight lg:text-6xl">
            Daily operations for gyms, built around the front desk.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/75 lg:text-lg">
            Start with memberships, payments, visit validation, and reporting. Expand later into devices, commerce, mobile, and automation.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/65">{t.auth.mvpFocus}</p>
              <p className="mt-2 text-xl font-semibold">{t.nav.membershipPlans}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/65">{t.auth.access}</p>
              <p className="mt-2 text-xl font-semibold">QR + Manual</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-sm text-white/65">{t.auth.reporting}</p>
              <p className="mt-2 text-xl font-semibold">{t.reports.title}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-surface p-8 shadow-[0_20px_80px_rgba(86,57,28,0.08)] lg:p-10">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              {t.auth.signIn}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              {t.auth.accessConsole}
            </h2>
            <p className="mt-4 text-sm leading-7 text-foreground/70">
              {t.auth.signInDescription}
            </p>
          </div>

          <SignInForm
            labels={{
              emailOrUsername: t.auth.emailOrUsername,
              password: t.auth.password,
              continue: t.auth.continue,
              signingIn: t.auth.signingIn,
            }}
          />

          <div className="mt-8 rounded-3xl border border-dashed border-line bg-surface-muted/60 p-5 text-sm leading-7 text-foreground/70">
            <p className="font-semibold text-foreground">{t.auth.pilotCredentials}</p>
            <p className="mt-2">Front desk: frontdesk@sparkgym.local / frontdesk123</p>
            <p>Owner: owner@sparkgym.local / owner123</p>
          </div>
        </section>
      </div>
    </main>
  );
}
