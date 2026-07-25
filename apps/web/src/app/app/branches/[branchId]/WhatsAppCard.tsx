"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import type { Dict } from "@/lib/i18n";

type Status = "idle" | "connecting" | "waiting_qr" | "reconnecting" | "connected" | "error";

export default function WhatsAppCard({
  branchId,
  canManage,
  t,
  className,
}: {
  branchId: string;
  canManage: boolean;
  t: Dict;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const base = `/api/tenancy/whatsapp/branches/${encodeURIComponent(branchId)}`;

  function startPolling(intervalMs: number) {
    stopPolling();
    pollRef.current = setInterval(() => void poll(), intervalMs);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function poll() {
    try {
      const statusRes = await fetch(`${base}/verify`, { method: "POST" });
      if (!statusRes.ok) return;

      const { status: waStatus } = (await statusRes.json()) as { ok: boolean; status: string };
      const wasConnected = prevStatusRef.current === "connected";
      prevStatusRef.current = waStatus;

      if (waStatus === "connected") {
        setStatus("connected");
        setQrDataUrl(null);
        // Switch to slow heartbeat poll — detects if device is removed
        if (!pollRef.current || (pollRef.current && wasConnected === false)) {
          startPolling(8_000);
        }
        return;
      }

      // Not connected — fetch QR
      const qrRes = await fetch(`${base}/qr`);
      if (!qrRes.ok) return;
      const { qr } = (await qrRes.json()) as { qr: string | null };

      if (waStatus === "disconnected" && !qr) {
        // Worker is restarting the session (device was removed) — show reconnecting
        setStatus("reconnecting");
        setQrDataUrl(null);
        startPolling(3_000);
      } else {
        // QR is ready
        setStatus("waiting_qr");
        startPolling(3_000);
        if (qr) {
          const dataUrl = await QRCode.toDataURL(qr, { width: 240, margin: 2 });
          setQrDataUrl(dataUrl);
        } else {
          setQrDataUrl(null);
        }
      }
    } catch {
      // transient poll failure — keep polling
    }
  }

  // On mount: check current status
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${base}/verify`, { method: "POST" });
        if (!res.ok) return;
        const { status: waStatus } = (await res.json()) as { ok: boolean; status: string };
        prevStatusRef.current = waStatus;
        if (waStatus === "connected") {
          setStatus("connected");
          startPolling(8_000); // slow heartbeat when already connected
        } else if (waStatus === "qr_required" || waStatus === "disconnected") {
          // Session exists but QR is pending or reconnecting
          setStatus("waiting_qr");
          void poll();
          startPolling(3_000);
        }
      } catch {
        // ignore — no session started yet
      }
    })();
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function handleConnect() {
    setStatus("connecting");
    setErrorMsg(null);
    try {
      const res = await fetch(base, { method: "PUT" });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        setErrorMsg(body.message ?? t.settings.whatsappGenericError);
        setStatus("error");
        return;
      }
      setStatus("waiting_qr");
      void poll();
      startPolling(3_000);
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  }

  async function handleDisconnect() {
    if (!confirm(t.settings.whatsappDisconnectConfirm)) return;
    stopPolling();
    prevStatusRef.current = null;
    try {
      await fetch(base, { method: "DELETE" });
    } catch {
      // ignore
    }
    setStatus("idle");
    setQrDataUrl(null);
  }

  return (
    <Card hoverable animate delay={2} className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">{t.settings.whatsapp}</p>

      <div className="mt-4">
        {status === "error" && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg ?? t.settings.whatsappGenericError}
          </div>
        )}

        {(status === "idle" || status === "error") && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-foreground/70">{t.settings.whatsappDescription}</p>
            {canManage && (
              <div>
                <Button
                  onClick={() => void handleConnect()}
                  variant="primary"
                  size="sm"
                  icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />}
                >
                  {t.settings.whatsappConnectButton}
                </Button>
              </div>
            )}
          </div>
        )}

        {status === "connecting" && (
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand" />
            <p className="text-sm text-foreground/70">{t.settings.whatsappStarting}</p>
          </div>
        )}

        {/* Device was removed — worker is restarting, new QR coming soon */}
        {status === "reconnecting" && (
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-yellow-400" />
            <p className="text-sm text-foreground/70">{t.settings.whatsappReconnecting}</p>
          </div>
        )}

        {status === "waiting_qr" && (
          <div className="flex flex-col items-start gap-4">
            {qrDataUrl ? (
              <>
                <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="WhatsApp QR code" width={240} height={240} />
                </div>
                <p className="max-w-sm text-sm text-foreground/70">{t.settings.whatsappScanInstruction}</p>
                <p className="text-xs text-foreground/40">{t.settings.whatsappRefreshHint}</p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand" />
                <p className="text-sm text-foreground/70">{t.settings.whatsappStarting}</p>
              </div>
            )}
            {canManage && (
              <Button onClick={() => void handleDisconnect()} variant="ghost" size="sm">
                {t.actions.cancel}
              </Button>
            )}
          </div>
        )}

        {status === "connected" && (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="success">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              {t.settings.whatsappConnected}
            </Badge>
            {canManage && (
              <Button onClick={() => void handleDisconnect()} variant="danger" size="sm">
                {t.settings.whatsappDisconnect}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
