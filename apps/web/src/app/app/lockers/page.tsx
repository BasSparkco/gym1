"use server";

import { listLockers } from "@/lib/lockers";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KeySquare, Plus } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { LockerStatus } from "@/lib/lockers";

function statusTone(status: LockerStatus): "success" | "neutral" | "warning" {
  if (status === "available") return "success";
  if (status === "maintenance") return "warning";
  return "neutral";
}

function statusText(t: Dict, status: LockerStatus): string {
  if (status === "available") return t.lockers.statusAvailable;
  if (status === "occupied") return t.lockers.statusOccupied;
  return t.lockers.statusMaintenance;
}

function sizeText(t: Dict, size: string | null): string | null {
  if (size === "small") return t.lockers.sizeSmall;
  if (size === "medium") return t.lockers.sizeMedium;
  if (size === "large") return t.lockers.sizeLarge;
  return null;
}

export default async function LockersPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [lockers, currencySymbol] = await Promise.all([
    listLockers(),
    getActiveCurrencySymbol(session.branch.id),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.lockers}
        title={t.lockers.title}
        description={formatDict(t.lockers.listDescription, {
          count: lockers.length,
          plural: lockers.length !== 1 ? "s" : "",
        })}
        actions={
          <Button href="/app/lockers/new" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
            {t.lockers.newLocker}
          </Button>
        }
      />

      {lockers.length === 0 ? (
        <EmptyState icon={<KeySquare className="h-5 w-5" strokeWidth={2} />} title={t.lockers.noLockers} />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lockers.map((locker, index) => {
            const size = sizeText(t, locker.size);
            return (
              <Card
                key={locker.id}
                as={Link}
                href={`/app/lockers/${locker.id}`}
                hoverable
                animate
                delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
                className="flex flex-col border-s-4 border-s-brand transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-brand">
                      <KeySquare className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{locker.lockerNumber}</h2>
                  </div>
                  <Badge tone={statusTone(locker.status)}>{statusText(t, locker.status)}</Badge>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm text-foreground/60">
                  <span>{size ?? t.lockers.sizeNone}</span>
                  <span className="font-mono text-base font-semibold text-foreground">
                    {currencySymbol}
                    {locker.monthlyPrice}
                  </span>
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
