"use client";

import { useRef, useState } from "react";

type Props = {
  memberId: string;
  currentPhotoUrl: string | null;
  apiBaseUrl: string;
};

export default function MemberPhotoUpload({ memberId, currentPhotoUrl, apiBaseUrl }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("picture", file);
      const res = await fetch(`${apiBaseUrl}/members/${memberId}/photo`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { member: { pictureUrl?: string } };
      if (data.member.pictureUrl) {
        const root = apiBaseUrl.replace(/\/api$/, "");
        setPhotoUrl(`${root}${data.member.pictureUrl}`);
      }
    } catch {
      setError("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Give the video element a tick to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 50);
    } catch {
      setError("Camera access denied or not available.");
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        closeCamera();
        void uploadFile(file);
      }
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="grid gap-3">
      {/* Current photo */}
      <div className="flex items-center gap-4">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Member photo"
            className="h-24 w-24 rounded-2xl object-cover border border-line"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-foreground/30 text-3xl">
            👤
          </div>
        )}
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
          </button>
          {typeof navigator !== "undefined" && "mediaDevices" in navigator && (
            <button
              type="button"
              onClick={() => void openCamera()}
              disabled={uploading}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-50"
            >
              Take photo
            </button>
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

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-xl w-full max-w-sm">
            <p className="text-sm font-semibold">Take a photo</p>
            <video ref={videoRef} className="rounded-2xl w-full" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className="flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium hover:border-brand hover:text-brand"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
