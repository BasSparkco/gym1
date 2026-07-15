"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [canUseCamera, setCanUseCamera] = useState(false);

  useEffect(() => {
    setCanUseCamera(typeof navigator !== "undefined" && "mediaDevices" in navigator);
  }, []);

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
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-foreground/30">
            <User className="h-9 w-9" strokeWidth={1.75} />
          </div>
        )}
        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            icon={<Upload className="h-3.5 w-3.5" strokeWidth={2} />}
          >
            {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
          </Button>
          {canUseCamera && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void openCamera()}
              disabled={uploading}
              icon={<Camera className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              Take photo
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

      {/* Camera modal */}
      {cameraOpen && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="animate-scale-in grid gap-4 rounded-3xl bg-white p-6 shadow-xl w-full max-w-sm">
            <p className="text-sm font-semibold">Take a photo</p>
            <video ref={videoRef} className="rounded-2xl w-full" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <Button type="button" variant="primary" onClick={capturePhoto} className="flex-1">
                Capture
              </Button>
              <Button type="button" variant="secondary" onClick={closeCamera} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
