import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";
import Link from "next/link";

export default async function BranchesPage() {
  const session = await requireSession();
  const t = await getT();
  const branches = await listBranches();
  const canManage = session.role === "owner" || session.role === "manager";

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.branches}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.branches.title}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            {branches.length} branch{branches.length !== 1 ? "es" : ""} in {session.tenant.name}.
          </p>
        </div>
        {canManage && (
          <Link
            href="/app/branches/new"
            className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
          >
            {t.branches.newBranch}
          </Link>
        )}
      </section>

      <section className="grid gap-3">
        {branches.length === 0 && (
          <div className="rounded-[2rem] border border-line bg-surface px-6 py-10 text-center text-sm text-foreground/60">
            {t.branches.noBranches}
          </div>
        )}
        {branches.map((branch) => (
          <article
            key={branch.id}
            className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{branch.name}</h2>
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      branch.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {branch.status === "active" ? t.status.active : t.status.inactive}
                  </span>
                </div>
                {(branch.address || branch.countryCode) && (
                  <p className="mt-1 text-sm text-foreground/60">
                    {branch.address}
                    {branch.address && branch.countryCode && ", "}
                    {branch.countryCode &&
                      (COUNTRIES.find((c) => c.code === branch.countryCode)?.name ??
                        branch.countryCode)}
                  </p>
                )}
                {branch.phone && (
                  <p className="mt-0.5 text-sm text-foreground/60">{branch.phone}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/branches/${branch.id}`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                >
                  {t.actions.view}
                </Link>
                {canManage && (
                  <Link
                    href={`/app/branches/${branch.id}/edit`}
                    className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
                  >
                    {t.actions.edit}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
