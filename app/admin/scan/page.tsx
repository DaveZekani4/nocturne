"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CheckCircle2, XCircle, AlertTriangle, ScanLine } from "lucide-react";

type ScanResult = {
  status: "valid" | "duplicate" | "invalid";
  message: string;
  breakdown?: string;
  groupSize?: number;
};

export default function GateScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const lastScannedCode = useRef<string | null>(null);
  const cooldownRef = useRef(false);

  const verifyCode = useCallback(async (code: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setScanning(false);

    try {
      const res = await fetch("/api/admin/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: "invalid", message: "Network error — try again." });
    }

    // Give staff a moment to read the result before resuming the scan loop
    setTimeout(() => {
      cooldownRef.current = false;
      lastScannedCode.current = null;
      setScanning(true);
      setResult(null);
    }, 2500);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrame: number;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setCameraError(
          "Could not access camera. Check browser permissions, or use HTTPS (required for camera access)."
        );
      }
    }

    function tick() {
      animationFrame = requestAnimationFrame(tick);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      if (!scanning) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data && code.data !== lastScannedCode.current) {
        lastScannedCode.current = code.data;
        verifyCode(code.data);
      }
    }

    startCamera();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, verifyCode]);

  return (
    <section className="flex flex-col items-center">
      <p className="font-glitch text-xs tracking-[0.3em] text-neon-purple-bright">
        ADMIN
      </p>
      <h1 className="mt-2 font-display font-800 text-3xl">Gate Scanner</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-foreground/60">
        Point the camera at a guest&apos;s pass QR code. Checks in
        automatically and flags duplicates or invalid codes.
      </p>

      <div className="relative mt-6 w-full max-w-sm overflow-hidden border border-neon-purple/40 bg-black">
        <video
          ref={videoRef}
          className="aspect-square w-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {scanning && !cameraError && (
          <div className="pointer-events-none absolute inset-8 border-2 border-dashed border-neon-purple/60">
            <ScanLine className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-purple/40" size={32} />
          </div>
        )}

        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center ${
              result.status === "valid"
                ? "bg-success/90"
                : result.status === "duplicate"
                  ? "bg-warning/90"
                  : "bg-danger/90"
            }`}
          >
            {result.status === "valid" && <CheckCircle2 size={48} className="text-background" />}
            {result.status === "duplicate" && <AlertTriangle size={48} className="text-background" />}
            {result.status === "invalid" && <XCircle size={48} className="text-background" />}

            {result.groupSize !== undefined && (
              <p className="font-display font-800 text-lg text-background">
                {result.groupSize} {result.groupSize === 1 ? "guest" : "guests"}
              </p>
            )}
            {result.breakdown && (
              <p className="font-glitch text-xs uppercase tracking-wider text-background/80">
                {result.breakdown}
              </p>
            )}
            <p className="font-glitch text-xs text-background/90">
              {result.message}
            </p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface p-6 text-center text-sm text-danger">
            {cameraError}
          </div>
        )}
      </div>

      <p className="mt-4 font-glitch text-[10px] uppercase tracking-wider text-foreground/40">
        {scanning ? "Scanning…" : "Processing…"}
      </p>
    </section>
  );
}