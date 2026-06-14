import { getMember } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PrintButton } from "@/components/members/print-button";
import Link from "next/link";
import QRCode from "qrcode";

type Props = { params: Promise<{ memberId: string }> };

export default async function MemberQrPage({ params }: Props) {
  const { memberId } = await params;
  await requireSession();
  const t = await getT();

  const [member, memberships] = await Promise.all([
    getMember(memberId),
    listMembershipsForMember(memberId),
  ]);

  const activeMembership = memberships.find((ms) => ms.status === "active");

  const svgString = await QRCode.toString(member.id, {
    type: "svg",
    width: 280,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

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

      <section className="flex flex-col items-center gap-6 rounded-[2rem] border border-line bg-surface px-8 py-10 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
        {/* QR code */}
        <div
          className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />

        {/* Member info below the QR */}
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

        <PrintButton label={t.members.printQrCode} />
      </section>
    </div>
  );
}
