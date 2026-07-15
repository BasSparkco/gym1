"use client";

import { useRef, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type Labels = {
  upload: string;
  change: string;
  remove: string;
  uploading: string;
  error: string;
};

type Props = {
  apiBaseUrl: string;
  /** API path (relative to apiBaseUrl) the logo is POSTed/DELETEd to, e.g. "/settings/logo" or "/branches/:id/logo". */
  endpoint: string;
  currentLogoUrl: string | null;
  labels: Labels;
};

export default function LogoUpload({ apiBaseUrl, endpoint, currentLogoUrl, labels }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resolveUrl(url: string) {
    const root = apiBaseUrl.replace(/\/api$/, "");
    return `${root}${url}`;
  }

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as {
        settings?: { logoUrl: string | null };
        branch?: { logoUrl?: string | null };
      };
      const nextUrl = data.settings?.logoUrl ?? data.branch?.logoUrl ?? null;
      setLogoUrl(nextUrl ? resolveUrl(nextUrl) : null);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Remove failed");
      setLogoUrl(null);
    } catch {
      setError(labels.error);
    } finally {
      setBusy(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 w-16 rounded-2xl border border-line bg-white object-contain p-1.5"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-foreground/30">
            <ImageIcon className="h-7 w-7" strokeWidth={1.75} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            icon={<Upload className="h-3.5 w-3.5" strokeWidth={2} />}
          >
            {busy ? labels.uploading : logoUrl ? labels.change : labels.upload}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void removeLogo()}
              disabled={busy}
              icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              {labels.remove}
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
