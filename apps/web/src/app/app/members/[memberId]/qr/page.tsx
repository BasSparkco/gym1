"use server";

import { getMember, sendMemberQr } from "@/lib/members";
import { listMembershipsForMember } from "@/lib/memberships";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PrintButton } from "@/components/members/print-button";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, MessageCircle } from "lucide-react";

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
      <PageHeader
        eyebrow={t.nav.members}
        title={t.members.qrCode}
        description={member.fullName}
        actions={
          <Button href={`/app/members/${member.id}`} variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.actions.back}
          </Button>
        }
      />

      {sent && (
        <div className="animate-scale-in rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800 font-medium">
          {t.members.qrSentSuccess}
        </div>
      )}
      {error && (
        <div className="animate-scale-in rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {t.members.qrSentFailed} {decodeURIComponent(error)}
        </div>
      )}

      <Card animate className="flex flex-col items-center gap-6 px-8 py-10">
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
            <Badge tone="success" className="mt-2">
              <span className="size-1.5 rounded-full bg-green-500" />
              {t.status.active} · {activeMembership.plan?.name ?? activeMembership.planId}
            </Badge>
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
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                {t.members.sendQrWhatsApp}
              </button>
            </form>
          )}

          <Button
            href={`/api/members/${member.id}/qrcode`}
            download="gym-qr.png"
            variant="secondary"
            icon={<Download className="h-4 w-4" strokeWidth={2} />}
          >
            Download
          </Button>
        </div>
      </Card>
    </div>
  );
}
