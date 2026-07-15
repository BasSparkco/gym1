"use server";

import { listGates } from "@/lib/gates";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DoorOpen, Plus, ChevronRight } from "lucide-react";

export default async function GatesSettingsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const gates = await listGates(session.branch.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.settings.title}
        title={t.settings.gatesTitle}
        description={t.settings.gatesDescription}
      />

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <Link
          href="/app/settings/branch"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.branches.title}
        </Link>
        <Link
          href="/app/settings/options"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.settings.options}
        </Link>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.nav.notifications}
        </Link>
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm">
          {t.settings.gates}
        </span>
      </nav>

      {/* Gate list */}
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            {t.settings.gatesTitle}
          </p>
          <Button href="/app/settings/gates/new" variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}>
            {t.settings.gateAddButton}
          </Button>
        </div>

        {gates.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={<DoorOpen className="h-5 w-5" strokeWidth={2} />} title={t.settings.gatesEmpty} />
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {gates.map((gate, index) => (
              <Card
                key={gate.id}
                as={Link}
                href={`/app/settings/gates/${gate.id}`}
                hoverable
                animate
                delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                className="flex items-center justify-between !bg-white !px-4 !py-3"
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
                    <Badge tone="success">{t.settings.gateDeviceConfigured}</Badge>
                  ) : (
                    <Badge tone="warning">{t.settings.gateDeviceNotConfigured}</Badge>
                  )}
                  {!gate.enabled && <Badge tone="neutral">Disabled</Badge>}
                  <ChevronRight className="h-4 w-4 text-foreground/30" strokeWidth={2} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
