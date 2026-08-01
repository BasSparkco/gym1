"use server";

import { listBranches, switchBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export default async function BranchSettingsPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner") {
    redirect("/app/dashboard");
  }

  const branches = await listBranches();
  const activeBranches = branches.filter((b) => b.status === "active");

  async function handleSwitch(formData: FormData) {
    "use server";
    const branchId = formData.get("branchId") as string;
    if (!branchId) return;
    await switchBranch(branchId);
    revalidatePath("/app", "layout");
    redirect("/app/settings/branch");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${t.settings.title} · ${t.branches.title}`}
        title={t.settings.activeBranchTitle}
        description={t.settings.activeBranchDescription}
      />

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm">
          {t.branches.title}
        </span>
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
        <Link
          href="/app/settings/notifications/templates"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.settings.templates}
        </Link>
        <Link
          href="/app/settings/gates"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-sm"
        >
          {t.settings.gates}
        </Link>
      </nav>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
          {t.settings.currentBranch}
        </p>
        <p className="mt-2 text-lg font-semibold">{session.branch.name}</p>
        <p className="mt-0.5 text-xs font-mono text-foreground/40">
          {session.branch.id}
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
          {t.settings.switchBranch}
        </p>

        {activeBranches.length <= 1 ? (
          <p className="mt-4 text-sm text-foreground/50">
            {t.settings.noOtherBranches}{" "}
            <Link
              href="/app/branches/new"
              className="text-brand hover:underline"
            >
              {t.settings.createABranch}
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-2">
            {activeBranches.map((branch) => {
              const isCurrent = branch.id === session.branch.id;
              return (
                <div
                  key={branch.id}
                  className={[
                    "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3",
                    isCurrent
                      ? "border-brand/30 bg-brand/5"
                      : "border-line bg-white",
                  ].join(" ")}
                >
                  <div>
                    <p
                      className={`text-sm font-medium ${isCurrent ? "text-brand" : ""}`}
                    >
                      {branch.name}
                    </p>
                    {branch.address && (
                      <p className="mt-0.5 text-xs text-foreground/50">
                        {branch.address}
                      </p>
                    )}
                  </div>
                  {isCurrent ? (
                    <Badge tone="brand">{t.settings.current}</Badge>
                  ) : (
                    <form action={handleSwitch}>
                      <input type="hidden" name="branchId" value={branch.id} />
                      <Button type="submit" variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />}>
                        {t.settings.switchAction}
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
