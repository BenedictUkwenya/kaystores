"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  size?: number;
  className?: string;
  /** Fires with a logo-composited PNG data URL when the QR is ready. */
  onReady?: (dataUrl: string) => void;
};

const QR_DARK = "#1c1914";
const QR_LIGHT = "#f9f7f2";
const BADGE_FILL = "#ffffff";
const BADGE_RING = "#b89a6a";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Client-side Kay QR with a refined center brand badge. */
export function KayQrCode({ value, size = 220, className, onReady }: Props) {
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
          margin: 3,
          errorCorrectionLevel: "H",
          color: {
            dark: QR_DARK,
            light: QR_LIGHT,
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

        // Compact badge — large logos punch a hole that looks unfinished.
        const badgeSize = size * 0.2;
        const logoSize = badgeSize * 0.62;
        const cx = size / 2;
        const cy = size / 2;
        const bx = cx - badgeSize / 2;
        const by = cy - badgeSize / 2;
        const radius = badgeSize * 0.28;

        // Soft cream underlay so QR modules don't show through
        ctx.fillStyle = QR_LIGHT;
        roundRect(ctx, bx - 2, by - 2, badgeSize + 4, badgeSize + 4, radius + 2);
        ctx.fill();

        // White plate
        ctx.fillStyle = BADGE_FILL;
        roundRect(ctx, bx, by, badgeSize, badgeSize, radius);
        ctx.fill();

        // Gold ring
        ctx.strokeStyle = BADGE_RING;
        ctx.lineWidth = Math.max(1.5, size * 0.008);
        roundRect(ctx, bx, by, badgeSize, badgeSize, radius);
        ctx.stroke();

        const lx = cx - logoSize / 2;
        const ly = cy - logoSize / 2;
        ctx.drawImage(logo, lx, ly, logoSize, logoSize);

        setError(null);
        onReady?.(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setError("Could not render QR");
      }
    }

    void draw();
    return () => {
      cancelled = true;
    };
  }, [value, size, onReady]);

  if (error) {
    return <p className="text-[12px] text-kay-muted">{error}</p>;
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-2xl ${className ?? ""}`}
      aria-label="Kay Reveal QR code"
    />
  );
}
