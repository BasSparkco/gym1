"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, Send } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { railBtn } from "@/components/members/member-profile-shared";
import {
  getCurrentPinAction,
  resendPinAction,
  setNewPinAction,
} from "@/app/app/members/[memberId]/pin-actions";

const inputClass =
  "rounded-2xl border border-line bg-white px-4 py-3 text-sm font-mono tracking-[0.3em] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

type ResendState = "idle" | "sending" | "sent" | { error: string };
type SetState = "idle" | "saving" | "saved" | { error: string };

export function MemberPinDialog({ memberId, t }: { memberId: string; t: Dict }) {
  const [open, setOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState<string | null | undefined>(undefined);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setState, setSetState] = useState<SetState>("idle");

  function openDialog() {
    setOpen(true);
    setCurrentPin(undefined);
    setResendState("idle");
    setSetState("idle");
    setPin("");
    setConfirmPin("");
    getCurrentPinAction(memberId)
      .then((res) => setCurrentPin(res.pin))
      .catch(() => setCurrentPin(null));
  }

  async function handleResend() {
    setResendState("sending");
    const result = await resendPinAction(memberId);
    if ("error" in result) {
      setResendState({ error: result.error });
      return;
    }
    if (result.whatsapp?.sent || result.email?.sent) {
      setResendState("sent");
      getCurrentPinAction(memberId)
        .then((res) => setCurrentPin(res.pin))
        .catch(() => undefined);
    } else {
      setResendState({
        error: result.whatsapp?.reason ?? result.email?.reason ?? "unknown",
      });
    }
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (pin !== confirmPin) {
      setSetState({ error: t.members.pinMismatch });
      return;
    }
    setSetState("saving");
    const result = await setNewPinAction(memberId, pin);
    if (result.ok) {
      setCurrentPin(pin);
      setSetState("saved");
    } else {
      setSetState({ error: result.error });
    }
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={railBtn}>
        <KeyRound className="h-4 w-4" strokeWidth={2.2} />
        {t.members.pinCodeButton}
      </button>

      {open &&
        createPortal(
          <Dialog open={open} onClose={() => setOpen(false)} title={t.members.appPinTitle}>
            <div className="grid gap-6 px-5 py-5">
              {/* 1. Current PIN */}
              <section className="grid gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  {t.members.currentPinLabel}
                </p>
                {currentPin === undefined ? (
                  <p className="text-sm text-foreground/60">…</p>
                ) : currentPin ? (
                  <p className="font-mono text-2xl tracking-[0.3em]">{currentPin}</p>
                ) : (
                  <p className="text-sm text-foreground/60">{t.members.noPinOnFile}</p>
                )}
              </section>

              <hr className="border-line" />

              {/* 2. Send a new random PIN */}
              <section className="grid gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  {t.members.sendNewPinLabel}
                </p>
                <p className="text-sm text-foreground/60">{t.members.sendNewPinDescription}</p>

                {resendState === "sent" ? (
                  <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                    {t.members.pinSentSuccess}
                  </p>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleResend}
                      disabled={resendState === "sending"}
                      icon={<Send className="h-4 w-4" strokeWidth={2} />}
                      className="w-fit"
                    >
                      {resendState === "sending" ? t.actions.saving : t.members.sendNewPinButton}
                    </Button>
                    {typeof resendState === "object" && (
                      <p className="text-sm text-red-700">
                        {t.members.pinSentFailed} {resendState.error}
                      </p>
                    )}
                  </>
                )}
              </section>

              <hr className="border-line" />

              {/* 3. Set a specific new PIN */}
              <section className="grid gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                  {t.members.setAppPin}
                </p>

                {setState === "saved" ? (
                  <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                    {t.members.appPinSetSuccess}
                  </p>
                ) : (
                  <form onSubmit={handleSetPin} className="grid gap-3">
                    <div className="grid gap-1.5">
                      <label htmlFor="new-pin" className="text-sm font-medium">
                        {t.members.newPinLabel}
                      </label>
                      <input
                        id="new-pin"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{4,8}"
                        minLength={4}
                        maxLength={8}
                        autoComplete="off"
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label htmlFor="confirm-pin" className="text-sm font-medium">
                        {t.members.confirmPinLabel}
                      </label>
                      <input
                        id="confirm-pin"
                        type="text"
                        inputMode="numeric"
                        pattern="\d{4,8}"
                        minLength={4}
                        maxLength={8}
                        autoComplete="off"
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    {typeof setState === "object" && (
                      <p className="text-sm text-red-700">{setState.error}</p>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={setState === "saving"}
                      icon={<KeyRound className="h-4 w-4" strokeWidth={2} />}
                      className="w-fit"
                    >
                      {setState === "saving" ? t.actions.saving : t.members.setAppPin}
                    </Button>
                  </form>
                )}
              </section>
            </div>
          </Dialog>,
          document.body,
        )}
    </>
  );
}
