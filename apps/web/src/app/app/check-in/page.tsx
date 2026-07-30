"use server";

import { performCheckIn } from "@/lib/check-in";
import { checkInEmployee } from "@/lib/employee-attendance";
import { listGates } from "@/lib/gates";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { CheckInMemberPicker } from "@/components/check-in/member-picker";
import { GateOpenButton } from "@/components/check-in/gate-open-button";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CheckCircle2, DoorOpen, UserCheck, UsersRound, XCircle } from "lucide-react";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CheckInPage({ searchParams }: Props) {
  const session = await requireSession();
  const t = await getT();
  const params = await searchParams;

  const memberGranted = params.type === "member" && params.result === "granted";
  const memberDenied = params.type === "member" && params.result === "denied";
  const employeeGranted = params.type === "employee" && params.result === "granted";
  const employeeDenied = params.type === "employee" && params.result === "denied";

  const gates = await listGates(session.branch.id).catch(() => []);
  const enabledGates = gates.filter((g) => g.enabled);

  async function handleMemberCheckIn(formData: FormData) {
    "use server";
    const identifier = ((formData.get("identifier") as string) ?? "").trim();

    const result = await performCheckIn(identifier, "manual");

    if (result.granted) {
      const planName = result.membership.plan?.name ?? result.membership.planId;
      redirect(
        `/app/check-in?type=member&result=granted` +
          `&memberName=${encodeURIComponent(result.member.fullName)}` +
          `&memberNumber=${encodeURIComponent(result.member.memberNumber)}` +
          `&plan=${encodeURIComponent(planName)}` +
          `&endDate=${encodeURIComponent(result.membership.endDate)}`,
      );
    } else {
      redirect(
        `/app/check-in?type=member&result=denied` +
          `&reason=${encodeURIComponent(result.reason)}` +
          `&identifier=${encodeURIComponent(identifier)}`,
      );
    }
  }

  async function handleEmployeeCheckIn(formData: FormData) {
    "use server";
    const identifier = ((formData.get("identifier") as string) ?? "").trim();

    const result = await checkInEmployee(identifier, "manual");

    if (result.granted) {
      redirect(
        `/app/check-in?type=employee&result=granted` +
          `&employeeName=${encodeURIComponent(result.employee.fullName)}` +
          `&employeeNumber=${encodeURIComponent(result.employee.employeeNumber)}`,
      );
    } else {
      redirect(
        `/app/check-in?type=employee&result=denied` +
          `&reason=${encodeURIComponent(result.reason)}` +
          `&identifier=${encodeURIComponent(identifier)}`,
      );
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.checkIn}
        title={t.checkIn.title}
        description={t.checkIn.description}
        actions={
          <>
            {enabledGates.length > 0 ? (
              enabledGates.map((gate) => (
                <GateOpenButton
                  key={gate.id}
                  gateId={gate.id}
                  label={gate.name}
                  successLabel={t.checkIn.gateOpened}
                  failLabel={t.checkIn.gateOpenFailed}
                />
              ))
            ) : (
              <GateOpenButton
                label={t.checkIn.openGate}
                successLabel={t.checkIn.gateOpened}
                failLabel={t.checkIn.gateOpenFailed}
              />
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members */}
        <div className="grid gap-4 content-start">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-brand" strokeWidth={2} />
            <p className="text-base font-semibold">{t.nav.members}</p>
          </div>

          {memberGranted && (
            <section className="animate-scale-in rounded-[2rem] border-2 border-green-300 bg-green-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_8px_20px_-6px_rgba(34,197,94,0.6)]">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
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

          {memberDenied && (
            <section className="animate-scale-in rounded-[2rem] border-2 border-red-200 bg-red-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.6)]">
                  <XCircle className="h-6 w-6" strokeWidth={2.5} />
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

          <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
            <p className="text-sm text-foreground/60">{t.checkIn.manualDescription}</p>
            <form action={handleMemberCheckIn} className="mt-4 grid gap-4">
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

              <Button type="submit" variant="primary" size="lg" icon={<DoorOpen className="h-5 w-5" strokeWidth={2} />} className="w-fit">
                {t.checkIn.checkInButton}
              </Button>
            </form>
          </section>
        </div>

        {/* Employees */}
        <div className="grid gap-4 content-start">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-brand" strokeWidth={2} />
            <p className="text-base font-semibold">{t.nav.employees}</p>
          </div>

          {employeeGranted && (
            <section className="animate-scale-in rounded-[2rem] border-2 border-green-300 bg-green-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_8px_20px_-6px_rgba(34,197,94,0.6)]">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-800">{t.attendance.accessGranted}</p>
                  <p className="mt-1 text-2xl font-bold text-green-900">{params.employeeName}</p>
                  <p className="mt-0.5 font-mono text-sm text-green-700">{params.employeeNumber}</p>
                </div>
              </div>
            </section>
          )}

          {employeeDenied && (
            <section className="animate-scale-in rounded-[2rem] border-2 border-red-200 bg-red-50 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_8px_20px_-6px_rgba(239,68,68,0.6)]">
                  <XCircle className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-800">{t.attendance.accessDenied}</p>
                  {params.identifier && (
                    <p className="mt-0.5 font-mono text-sm text-red-700">{params.identifier}</p>
                  )}
                  <p className="mt-2 text-sm text-red-700">{params.reason}</p>
                </div>
              </div>
            </section>
          )}

          <section className="animate-fade-in-up rounded-[2rem] border border-line bg-surface px-6 py-6 shadow-[0_18px_50px_rgba(86,57,28,0.06)]">
            <p className="text-sm text-foreground/60">{t.attendance.checkInDescription}</p>
            <form action={handleEmployeeCheckIn} className="mt-4 grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="identifier" className="text-sm font-medium">
                  {t.attendance.employeeNumber} <span className="text-red-500">*</span>
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  required
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" icon={<DoorOpen className="h-5 w-5" strokeWidth={2} />} className="w-fit">
                {t.attendance.checkInButton}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
