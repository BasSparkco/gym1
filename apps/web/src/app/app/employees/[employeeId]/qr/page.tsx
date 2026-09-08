"use server";

import { getEmployee } from "@/lib/employees";
import { sendEmployeeQr } from "@/lib/employee-attendance";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PrintButton } from "@/components/members/print-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { ArrowLeft, Download, MessageCircle } from "lucide-react";

type Props = {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function EmployeeQrPage({ params, searchParams }: Props) {
  const { employeeId } = await params;
  const { sent, error } = await searchParams;
  await requireSession();
  const t = await getT();

  const employee = await getEmployee(employeeId);

  async function handleSendQr() {
    "use server";
    const result = await sendEmployeeQr(employeeId);
    if (result.sent) {
      redirect(`/app/employees/${employeeId}/qr?sent=1`);
    } else {
      redirect(`/app/employees/${employeeId}/qr?error=${encodeURIComponent(result.reason ?? "unknown")}`);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.employees.title}
        title={t.attendance.qrCode}
        description={employee.fullName}
        actions={
          <Button href={`/app/employees/${employee.id}`} variant="secondary" icon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={2} />}>
            {t.actions.back}
          </Button>
        }
      />

      {sent && (
        <div className="animate-scale-in rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800 font-medium">
          {t.employees.qrSentSuccess}
        </div>
      )}
      {error && (
        <div className="animate-scale-in rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {t.employees.qrSentFailed} {decodeURIComponent(error)}
        </div>
      )}

      <Card animate className="flex flex-col items-center gap-6 px-8 py-10">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <img
            src={`/api/employee-attendance/${employee.id}/qrcode`}
            alt={`QR code for ${employee.fullName}`}
            width={280}
            height={280}
            className="block"
          />
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold tracking-tight">{employee.fullName}</p>
          <p className="mt-1 font-mono text-sm text-foreground/60">
            {employee.employeeNumber}
          </p>
          <Badge tone={employee.status === "active" ? "success" : "neutral"} className="mt-2">
            <span className="size-1.5 rounded-full bg-current" />
            {employee.status === "active" ? t.employees.active : t.employees.inactive}
          </Badge>
        </div>

        <p className="max-w-xs text-center text-sm leading-6 text-foreground/50">
          {t.attendance.qrCodeDescription}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <PrintButton label={t.attendance.printQrCode} />

          {employee.phone && (
            <form action={handleSendQr}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md active:translate-y-0"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={2} />
                {t.employees.sendQrWhatsApp}
              </button>
            </form>
          )}

          <Button
            href={`/api/employee-attendance/${employee.id}/qrcode`}
            download="employee-qr.png"
            variant="secondary"
            icon={<Download className="h-4 w-4" strokeWidth={2} />}
          >
            {t.attendance.downloadQrCode}
          </Button>
        </div>
      </Card>
    </div>
  );
}
