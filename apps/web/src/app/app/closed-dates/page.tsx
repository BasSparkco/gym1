"use server";

import { listClosedDates, deleteClosedDate } from "@/lib/closed-dates";
import { listBranches } from "@/lib/branches";
import { requireSession } from "@/lib/session";
import { getT, formatDict } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarOff, Plus, Trash2 } from "lucide-react";

export default async function ClosedDatesPage() {
  const session = await requireSession();
  const t = await getT();

  if (session.role !== "owner" && session.role !== "manager") {
    redirect("/app/dashboard");
  }

  const [closedDates, branches] = await Promise.all([listClosedDates(), listBranches()]);
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  async function handleDelete(formData: FormData) {
    "use server";
    const closedDateId = formData.get("closedDateId") as string;
    await deleteClosedDate(closedDateId);
    redirect("/app/closed-dates");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.closedDates}
        title={t.closedDates.title}
        description={formatDict(t.closedDates.listDescription, {
          count: closedDates.length,
          plural: closedDates.length !== 1 ? "s" : "",
        })}
        actions={
          <Button href="/app/closed-dates/new" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2} />}>
            {t.closedDates.newClosedDate}
          </Button>
        }
      />

      {closedDates.length === 0 ? (
        <EmptyState icon={<CalendarOff className="h-5 w-5" strokeWidth={2} />} title={t.closedDates.noClosedDates} />
      ) : (
        <div className="grid gap-3">
          {closedDates.map((closedDate, index) => (
            <Card
              key={closedDate.id}
              animate
              delay={Math.min(index + 1, 6) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
              className="flex items-center justify-between !bg-white !px-4 !py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <CalendarOff className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium">{closedDate.date}</p>
                  <p className="mt-0.5 text-xs text-foreground/50">{closedDate.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">
                  {closedDate.branchId ? branchMap.get(closedDate.branchId) ?? closedDate.branchId : t.closedDates.allBranches}
                </Badge>
                <form action={handleDelete}>
                  <input type="hidden" name="closedDateId" value={closedDate.id} />
                  <Button type="submit" variant="secondary" size="sm" icon={<Trash2 className="h-4 w-4" strokeWidth={2} />}>
                    {t.closedDates.delete}
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
