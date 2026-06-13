"use server";

import { performCheckIn } from "@/lib/check-in";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { CheckInMemberPicker } from "@/components/check-in/member-picker";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CheckInPage({ searchParams }: Props) {
  await requireSession();
  const t = await getT();
  const params = await searchParams;

  const resultStatus = params.result;
  const granted = resultStatus === "granted";
  const denied = resultStatus === "denied";

  async function handleCheckIn(formData: FormData) {
    "use server";
    const identifier = (formData.get("identifier") as string ?? "").trim();
    const accessMethod = (formData.get("accessMethod") as "manual" | "qr") ?? "manual";

    const result = await performCheckIn(identifier, accessMethod);

    if (result.granted) {
      const planName = result.membership.plan?.name ?? result.membership.planId;
      redirect(
        `/app/check-in?result=granted` +
          `&memberName=${encodeURIComponent(result.member.fullName)}` +
          `&memberNumber=${encodeURIComponent(result.member.memberNumber)}` +
          `&plan=${encodeURIComponent(planName)}` +
          `&endDate=${encodeURIComponent(result.membership.endDate)}`,
      );
    } else {
      redirect(
        `/app/check-in?result=denied` +
          `&reason=${encodeURIComponent(result.reason)}` +
          `&identifier=${encodeURIComponent(identifier)}`,
      );
    }
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          {t.nav.checkIn}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t.checkIn.title}</h1>
        <p className="mt-2 text-sm text-foreground/60">
          {t.checkIn.description}
        </p>
      </section>

      {/* Result banner */}
      {granted && (
        <section className="rounded-[2rem] border-2 border-green-300 bg-green-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white text-xl font-bold">
              ✓
            </div>
            <div>
              <p className="text-lg font-semibold text-green-800">{t.checkIn.accessGranted}</p>
              <p className="mt-1 text-2xl font-bold text-green-900">{params.memberName}</p>
              <p className="mt-0.5 font-mono text-sm text-green-700">{params.memberNumber}</p>
              <p className="mt-2 text-sm text-green-700">
                <span className="font-medium">{params.plan}</span>
                {params.endDate && (
                  <span className="ml-2 text-green-600">· {t.checkIn.expires} {params.endDate}</span>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {denied && (
        <section className="rounded-[2rem] border-2 border-red-200 bg-red-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-xl font-bold">
              ✕
            </div>
            <div>
              <p className="text-lg font-semibold text-red-800">{t.checkIn.accessDenied}</p>
              {params.identifier && (
                <p className="mt-0.5 font-mono text-sm text-red-700">{params.identifier}</p>
              )}
              <p className="mt-2 text-sm text-red-700">{params.reason}</p>
            </div>
          </div>
        </section>
      )}

      {/* Check-in form */}
      <section className="rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        <form action={handleCheckIn} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              {t.checkIn.memberNumber} <span className="text-red-500">*</span>
            </label>
            <CheckInMemberPicker
              searchPlaceholder={t.checkIn.searchPlaceholder}
              selectedLabel={t.checkIn.selectedMember}
              clearLabel={t.checkIn.clearSelection}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="accessMethod" className="text-sm font-medium">
              {t.checkIn.accessMethod}
            </label>
            <select
              id="accessMethod"
              name="accessMethod"
              defaultValue="manual"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="manual">{t.checkIn.manualEntry}</option>
              <option value="qr">{t.checkIn.qrScan}</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-full bg-brand px-8 py-3 text-base font-semibold text-white transition hover:bg-brand/90"
          >
            {t.checkIn.checkInButton}
          </button>
        </form>
      </section>
    </div>
  );
}
