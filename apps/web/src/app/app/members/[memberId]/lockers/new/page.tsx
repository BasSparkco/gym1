"use server";

import { getMember } from "@/lib/members";
import { listLockerRentalsForMember, createLockerRental, listLockers } from "@/lib/lockers";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { getActiveCurrencySymbol } from "@/lib/currency";
import { formatDate } from "@/lib/date-format";
import { redirect } from "next/navigation";
import LockerFormFields from "./locker-form-fields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { KeySquare } from "lucide-react";

type Props = { params: Promise<{ memberId: string }> };

export default async function SellLockerPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, rentals, allLockers, settings] = await Promise.all([
    getMember(memberId),
    listLockerRentalsForMember(memberId),
    listLockers(),
    getSettings(),
  ]);
  const currencySymbol = await getActiveCurrencySymbol(member.homeBranchId);
  const dateFormat = settings.dateFormat ?? "dd/mm/yyyy";

  const availableLockers = allLockers.filter(
    (l) => l.branchId === member.homeBranchId && l.status === "available",
  );
  const activeRental = rentals.find((r) => r.status === "active");
  const today = new Date().toISOString().slice(0, 10);

  async function handleCreate(formData: FormData) {
    "use server";
    const lockerId = formData.get("lockerId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const rawPrice = formData.get("finalPrice") as string;
    const finalPrice = rawPrice ? Number(rawPrice) : undefined;

    await createLockerRental({
      lockerId,
      memberId,
      startDate,
      endDate,
      finalPrice: finalPrice !== undefined && !isNaN(finalPrice) ? finalPrice : undefined,
    });

    redirect(`/app/members/${memberId}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={`${t.lockers.sell} — ${member.fullName}`}
        description={t.lockers.sellDescription}
      />

      {activeRental && (
        <section className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm">
          <p className="font-medium text-yellow-800">{t.lockers.activeRentalExists}</p>
          <p className="mt-1 text-yellow-700">
            Locker #{activeRental.locker?.lockerNumber ?? activeRental.lockerId}, ends{" "}
            {formatDate(activeRental.endDate, dateFormat)}.
          </p>
        </section>
      )}

      <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCreate} className="grid gap-5">
          <LockerFormFields
            lockers={availableLockers}
            today={today}
            dateFormat={dateFormat}
            currencySymbol={currencySymbol}
            labels={{
              selectLocker: t.lockers.selectLocker,
              startDate: t.lockers.startDate,
              endDate: t.lockers.endDate,
              finalPrice: t.lockers.finalPrice,
              noLockersAvailable: t.lockers.noLockersAvailable,
              createLockerFirst: t.lockers.createLockerFirst,
            }}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={availableLockers.length === 0}
              icon={<KeySquare className="h-4 w-4" strokeWidth={2} />}
            >
              {t.lockers.activateRental}
            </Button>
            <Button href={`/app/members/${memberId}`} variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
