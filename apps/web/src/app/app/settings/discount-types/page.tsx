"use server";

import Link from "next/link";
import { listDiscountTypes, localizedDiscountTypeName } from "@/lib/discount-types";
import { requireSession } from "@/lib/session";
import { getT, getLang } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Percent, Plus } from "lucide-react";

export default async function DiscountTypesSettingsPage() {
  const session = await requireSession();
  const t = await getT();
  const lang = await getLang();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const discountTypes = await listDiscountTypes({ includeInactive: true });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.settings.title}
        title={t.settings.discountTypesTitle}
        description={t.settings.discountTypesDescription}
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
        <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-sm">
          {t.settings.discountTypes}
        </span>
      </nav>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/50">
            {t.settings.discountTypesTitle}
          </p>
          <Button
            href="/app/settings/discount-types/new"
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}
          >
            {t.settings.discountTypeAddButton}
          </Button>
        </div>

        {discountTypes.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={<Percent className="h-5 w-5" strokeWidth={2} />} title={t.settings.discountTypesEmpty} />
          </div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start">
                  <th className="pb-3 pe-6 font-semibold">{t.settings.discountTypeName}</th>
                  <th className="pb-3 pe-6 font-semibold">{t.settings.discountTypeDescriptionField}</th>
                  <th className="pb-3 pe-6 font-semibold">{t.settings.discountTypeDefaultPercent}</th>
                  <th className="pb-3 pe-6 font-semibold">{t.settings.discountTypeStatus}</th>
                  <th className="pb-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {discountTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="py-3 pe-6 font-medium">{localizedDiscountTypeName(type, lang)}</td>
                    <td className="py-3 pe-6 text-foreground/60">{type.description ?? "—"}</td>
                    <td className="py-3 pe-6 text-foreground/60">{type.defaultPercent}%</td>
                    <td className="py-3 pe-6">
                      <Badge tone={type.isActive ? "success" : "neutral"}>
                        {type.isActive ? t.settings.discountTypeStatusActive : t.settings.discountTypeStatusInactive}
                      </Badge>
                    </td>
                    <td className="py-3 text-end">
                      <Link href={`/app/settings/discount-types/${type.id}`} className="text-brand hover:underline">
                        {t.actions.edit}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
