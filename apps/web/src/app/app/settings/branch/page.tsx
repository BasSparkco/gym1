"use server";

import { listBranches, switchBranch } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    redirect("/app/settings/branch");
  }

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.settings.title} · {t.branches.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Active branch
        </h1>
        <p className="mt-2 text-sm leading-7 text-foreground/70">
          Select which branch you are currently operating from. This controls
          which members and visits you see across the application.
        </p>
      </section>

      {/* Sub-nav */}
      <nav className="flex gap-2 flex-wrap">
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white">
          {t.branches.title}
        </span>
        <Link
          href="/app/settings/language"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.settings.language}
        </Link>
        <Link
          href="/app/settings/notifications"
          className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.nav.notifications}
        </Link>
      </nav>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
          Current branch
        </p>
        <p className="mt-2 text-lg font-semibold">{session.branch.name}</p>
        <p className="mt-0.5 text-xs font-mono text-foreground/40">
          {session.branch.id}
        </p>
      </section>

      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
          Switch branch
        </p>

        {activeBranches.length <= 1 ? (
          <p className="mt-4 text-sm text-foreground/50">
            No other active branches to switch to.{" "}
            <Link
              href="/app/branches/new"
              className="text-brand hover:underline"
            >
              Create a branch
            </Link>{" "}
            first.
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
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                      Current
                    </span>
                  ) : (
                    <form action={handleSwitch}>
                      <input type="hidden" name="branchId" value={branch.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium transition hover:border-brand hover:text-brand"
                      >
                        Switch
                      </button>
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
