"use server";

import { getMember, sendMemberQr } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PrintButton } from "@/components/members/print-button";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function MemberQrPage({ params, searchParams }: Props) {
  const { memberId } = await params;
  const { sent, error } = await searchParams;
  await requireSession();
  const t = await getT();

  const [member, memberships] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
  ]);

  const activeMembership = memberships.find((ms) => ms.status === "active");

  async function handleSendQr() {
    "use server";
    const result = await sendMemberQr(memberId);
    if (result.sent) {
      redirect(`/app/members/${memberId}/qr?sent=1`);
    } else {
      redirect(`/app/members/${memberId}/qr?error=${encodeURIComponent(result.reason ?? "unknown")}`);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {t.nav.members}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t.members.qrCode}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">{member.fullName}</p>
        </div>
        <Link
          href={`/app/members/${member.id}`}
          className="shrink-0 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
        >
          {t.actions.back}
        </Link>
      </section>

      {sent && (
        <div className="rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800 font-medium">
          {t.members.qrSentSuccess}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {t.members.qrSentFailed} {decodeURIComponent(error)}
        </div>
      )}

      <section className="flex flex-col items-center gap-6 rounded-[2rem] border border-line bg-surface px-8 py-10 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        {/* QR code fetched from API — uses device-generated PNG (UUID content) */}
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <img
            src={`/api/members/${member.id}/qrcode`}
            alt={`QR code for ${member.fullName}`}
            width={280}
            height={280}
            className="block"
          />
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold tracking-tight">{member.fullName}</p>
          <p className="mt-1 font-mono text-sm text-foreground/60">
            {member.memberNumber}
          </p>
          {activeMembership && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              <span className="size-1.5 rounded-full bg-green-500" />
              {t.status.active} · {activeMembership.plan?.name ?? activeMembership.planId}
            </p>
          )}
        </div>

        <p className="max-w-xs text-center text-sm leading-6 text-foreground/50">
          {t.members.qrCodeDescription}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <PrintButton label={t.members.printQrCode} />

          {member.phone && (
            <form action={handleSendQr}>
              <button
                type="submit"
                className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
              >
                {t.members.sendQrWhatsApp}
              </button>
            </form>
          )}

          <a
            href={`/api/members/${member.id}/qrcode`}
            download="gym-qr.png"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            Download
          </a>
        </div>
      </section>
    </div>
  );
}
