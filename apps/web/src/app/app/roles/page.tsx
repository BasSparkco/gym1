import { listRoles } from "@/lib/users";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import Link from "next/link";

export default async function RolesPage() {
  await requireSession();
  const t = await getT();
  const roles = await listRoles();

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.usersRoles}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.roles.title}</h1>
          <p className="mt-2 text-sm leading-7 text-foreground/70">
            MVP role definitions and their operational access levels.
          </p>
        </div>
        <Link
          href="/app/users"
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.roles.staffUsers}
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => {
          const badgeStyle =
            role.id === "owner"
              ? "bg-brand/10 text-brand"
              : role.id === "manager"
              ? "bg-accent/10 text-accent"
              : "bg-gray-100 text-gray-600";

          return (
            <article
              key={role.id}
              className="rounded-[1.75rem] border border-line bg-surface px-6 py-5"
            >
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle}`}>
                {role.label}
              </span>
              <p className="mt-3 text-sm leading-7 text-foreground/70">{role.description}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
          {t.roles.mvpAccessSummary}
        </p>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-3 pr-6 font-semibold">{t.roles.capability}</th>
                <th className="pb-3 pr-6 text-center font-semibold">{t.roles.owner}</th>
                <th className="pb-3 pr-6 text-center font-semibold">{t.roles.manager}</th>
                <th className="pb-3 text-center font-semibold">{t.roles.frontDesk}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                [t.nav.dashboard, "✓", "✓", "✓"],
                [t.nav.branches, "✓", "✓", "—"],
                [t.nav.usersRoles, "✓", "✓", "—"],
                [t.nav.membershipPlans, "✓", "✓", "—"],
                [t.nav.members, "✓", "✓", "✓"],
                [t.nav.checkIn, "✓", "✓", "✓"],
                [t.nav.visits, "✓", "✓", "✓"],
                [t.nav.notifications, "✓", "✓", "✓"],
                [t.nav.reports, "✓", "✓", "—"],
              ].map(([capability, owner, manager, frontDesk]) => (
                <tr key={capability}>
                  <td className="py-3 pr-6 font-medium">{capability}</td>
                  <td className="py-3 pr-6 text-center text-foreground/60">{owner}</td>
                  <td className="py-3 pr-6 text-center text-foreground/60">{manager}</td>
                  <td className="py-3 text-center text-foreground/60">{frontDesk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
