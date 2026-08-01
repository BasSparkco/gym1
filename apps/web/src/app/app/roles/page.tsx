import { listRoles } from "@/lib/users";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";

const roleTone: Record<string, BadgeTone> = {
  owner: "brand",
  manager: "accent",
};

export default async function RolesPage() {
  await requireSession();
  const t = await getT();
  const roles = await listRoles();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.usersRoles}
        title={t.roles.title}
        description="MVP role definitions and their operational access levels."
        actions={
          <Button href="/app/users" variant="secondary">
            {t.roles.staffUsers}
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {roles.map((role, index) => (
          <Card
            key={role.id}
            hoverable
            animate
            delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
          >
            <Badge tone={roleTone[role.id] ?? "neutral"} className="font-semibold">
              {role.label}
            </Badge>
            <p className="mt-3 text-sm leading-7 text-foreground/70">{role.description}</p>
          </Card>
        ))}
      </section>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
          {t.roles.mvpAccessSummary}
        </p>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-start">
                <th className="pb-3 pe-6 font-semibold">{t.roles.capability}</th>
                <th className="pb-3 pe-6 text-center font-semibold">{t.roles.owner}</th>
                <th className="pb-3 pe-6 text-center font-semibold">{t.roles.manager}</th>
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
                  <td className="py-3 pe-6 font-medium">{capability}</td>
                  <td className="py-3 pe-6 text-center text-foreground/60">{owner}</td>
                  <td className="py-3 pe-6 text-center text-foreground/60">{manager}</td>
                  <td className="py-3 text-center text-foreground/60">{frontDesk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
