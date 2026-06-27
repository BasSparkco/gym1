"use server";

import { listGates } from "@/lib/gates";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GatesSettingsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const gates = await listGates(session.branch.id);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.settings.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t.settings.gatesTitle}
        </h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          {t.settings.gatesDescription}
        </p>
      </section>

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <Link
          href="/app/settings/branch"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.branches.title}
        </Link>
        <Link
          href="/app/settings/language"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.language}
        </Link>
        <Link
          href="/app/settings/display"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.display}
        </Link>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.nav.notifications}
        </Link>
        <Link
          href="/app/settings/whatsapp"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.whatsapp}
        </Link>
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">
          {t.settings.gates}
        </span>
      </nav>

      {/* Gate list */}
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            {t.settings.gatesTitle}
          </p>
          <Link
            href="/app/settings/gates/new"
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.settings.gateAddButton}
          </Link>
        </div>

        {gates.length === 0 ? (
          <p className="mt-6 text-sm text-foreground/50">{t.settings.gatesEmpty}</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {gates.map((gate) => (
              <Link
                key={gate.id}
                href={`/app/settings/gates/${gate.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-brand"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg",
                      gate.genderRestriction === "male"
                        ? "bg-blue-100 text-blue-600"
                        : gate.genderRestriction === "female"
                          ? "bg-pink-100 text-pink-600"
                          : "bg-brand/10 text-brand",
                    ].join(" ")}
                  >
                    {gate.genderRestriction === "male"
                      ? "♂"
                      : gate.genderRestriction === "female"
                        ? "♀"
                        : "⛩"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{gate.name}</p>
                    <p className="mt-0.5 text-xs text-foreground/50">
                      {gate.genderRestriction === "male"
                        ? t.settings.gateGenderMale
                        : gate.genderRestriction === "female"
                          ? t.settings.gateGenderFemale
                          : t.settings.gateGenderNone}
                      {" · "}
                      {t.settings.gateLockNumber} {gate.lockNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gate.hasDevice ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {t.settings.gateDeviceConfigured}
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                      {t.settings.gateDeviceNotConfigured}
                    </span>
                  )}
                  {!gate.enabled && (
                    <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium text-foreground/50">
                      Disabled
                    </span>
                  )}
                  <svg
                    className="h-4 w-4 text-foreground/30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
