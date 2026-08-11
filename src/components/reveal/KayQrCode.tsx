"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  size?: number;
  className?: string;
};

/** Client-side Kay QR with centered brand mark. */
export function KayQrCode({ value, size = 220, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      try {
        const QRCode = (await import("qrcode")).default;
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#1a1a1a",
            light: "#f9f7f2",
          },
        });

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = "/brand/icon-512.png";
        await new Promise<void>((resolve, reject) => {
          logo.onload = () => resolve();
          logo.onerror = () => reject(new Error("logo"));
        });

        if (cancelled) return;

        const logoSize = size * 0.22;
        const pad = logoSize * 0.12;
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;

        ctx.fillStyle = "#f9f7f2";
        ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        setError(null);
      } catch {
        if (!cancelled) setError("Could not render QR");
      }
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (error) {
    return (
      <p className="text-[12px] text-kay-muted">{error}</p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      aria-label="Kay Reveal QR code"
    />
  );
}
