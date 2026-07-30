"use server";

import { getMember, setMemberPin } from "@/lib/members";
import { requireSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound } from "lucide-react";

type Props = {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
};

const inputClass =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm font-mono tracking-[0.3em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default async function MemberPinPage({ params, searchParams }: Props) {
  const { memberId } = await params;
  const { sent, error } = await searchParams;
  await requireSession();
  const t = await getT();

  const member = await getMember(memberId);

  async function handleSetPin(formData: FormData) {
    "use server";
    const pin = (formData.get("pin") as string) ?? "";
    const confirmPin = (formData.get("confirmPin") as string) ?? "";

    if (pin !== confirmPin) {
      redirect(`/app/members/${memberId}/pin?error=${encodeURIComponent(t.members.pinMismatch)}`);
    }

    try {
      await setMemberPin(memberId, pin);
    } catch (err) {
      let message = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(message) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // not JSON, use as-is
      }
      redirect(`/app/members/${memberId}/pin?error=${encodeURIComponent(message)}`);
    }

    redirect(`/app/members/${memberId}/pin?sent=1`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={t.nav.members}
        title={t.members.appPinTitle}
        description={member.fullName}
        actions={
          <Button href={`/app/members/${member.id}`} variant="secondary" icon={<ArrowLeft className="h-4 w-4" strokeWidth={2} />}>
            {t.actions.back}
          </Button>
        }
      />

      {sent && (
        <div className="animate-scale-in rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800 font-medium">
          {t.members.appPinSetSuccess}
        </div>
      )}
      {error && (
        <div className="animate-scale-in rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}

      <Card animate className="grid gap-6 px-6 py-6">
        <p className="text-sm text-foreground/60">{t.members.appPinDescription}</p>

        <form action={handleSetPin} className="grid gap-5 sm:max-w-xs">
          <div className="grid gap-1.5">
            <label htmlFor="pin" className="text-sm font-medium">
              {t.members.newPinLabel}
            </label>
            <input
              id="pin"
              name="pin"
              type="text"
              inputMode="numeric"
              pattern="\d{4,8}"
              minLength={4}
              maxLength={8}
              autoComplete="off"
              required
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="confirmPin" className="text-sm font-medium">
              {t.members.confirmPinLabel}
            </label>
            <input
              id="confirmPin"
              name="confirmPin"
              type="text"
              inputMode="numeric"
              pattern="\d{4,8}"
              minLength={4}
              maxLength={8}
              autoComplete="off"
              required
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" icon={<KeyRound className="h-4 w-4" strokeWidth={2} />}>
              {t.members.setAppPin}
            </Button>
            <Button href={`/app/members/${memberId}`} variant="secondary">
              {t.actions.cancel}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
