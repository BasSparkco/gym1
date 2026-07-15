"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  uploadPhotoLabel: string;
  changePhotoLabel: string;
  takePhotoLabel: string;
  helpText: string;
};

export default function NewMemberPhotoCapture({
  uploadPhotoLabel,
  changePhotoLabel,
  takePhotoLabel,
  helpText,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [previewUrl]);

  function setPreviewFromFile(file: File) {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreviewFromFile(file);
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      setCameraOpen(true);
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
      if (blob && fileInputRef.current) {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        setPreviewFromFile(file);
      }
      closeCamera();
    }, "image/jpeg", 0.9);
  }

  return (
    <div className="flex items-center gap-4">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Member photo preview"
          className="h-24 w-24 rounded-2xl object-cover border border-line"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-foreground/30">
          <User className="h-9 w-9" strokeWidth={1.75} />
        </div>
      )}
      <div className="grid gap-1.5">
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor="picture"
            className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand inline-block"
          >
            {previewUrl ? changePhotoLabel : uploadPhotoLabel}
          </label>
          {canUseCamera && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void openCamera()}
              icon={<Camera className="h-3.5 w-3.5" strokeWidth={2} />}
            >
              {takePhotoLabel}
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          id="picture"
          name="picture"
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-foreground/50">{helpText}</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {cameraOpen && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="animate-scale-in grid gap-4 rounded-3xl bg-white p-6 shadow-xl w-full max-w-sm">
            <p className="text-sm font-semibold">{takePhotoLabel}</p>
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
