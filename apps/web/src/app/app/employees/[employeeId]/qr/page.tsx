"use server";

import { getEmployee } from "@/lib/employees";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { PrintButton } from "@/components/members/print-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";

type Props = {
  params: Promise<{ employeeId: string }>;
};

export default async function EmployeeQrPage({ params }: Props) {
  const { employeeId } = await params;
  await requireSession();
  const t = await getT();

  const employee = await getEmployee(employeeId);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.employees.title}
        title={t.attendance.qrCode}
        description={employee.fullName}
        actions={
          <Button href={`/app/employees/${employee.id}`} variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.actions.back}
          </Button>
        }
      />

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
