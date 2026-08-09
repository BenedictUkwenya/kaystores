"use client";

import Image from "next/image";

type KayLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  variant?: "light" | "dark" | "auto";
  /** Full-bleed atmospheric stage (route loading / overlays). */
  stage?: boolean;
  className?: string;
};

const sizes = {
  sm: 40,
  md: 64,
  lg: 80,
} as const;

/**
 * Brand loading animation — mark + orbit + progress rail.
 * Motion styles live in globals.css (always loaded with the app).
 */
export function KayLoader({
  size = "md",
  label = "",
  variant = "auto",
  stage = false,
  className = "",
}: KayLoaderProps) {
  const px = sizes[size];
  const orbit = Math.round(px * 1.45);
  const status = label || "Loading";
  const forceDark = variant === "dark";

  const body = (
    <div
      className={`kay-ld-root relative z-[2] flex flex-col items-center justify-center gap-5 text-[#1a1814] ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={status}
    >
      <div
        className="relative grid place-items-center"
        style={{ width: orbit, height: orbit }}
      >
        <span
          className="kay-ld-glow pointer-events-none absolute inset-[10%] rounded-full blur-md"
          style={{
            background:
              "radial-gradient(circle, rgba(196,165,116,0.4), transparent 70%)",
          }}
          aria-hidden
        />

        {/* Outer wrapper uses Tailwind spin as a hard fallback if custom CSS is late */}
        <div className="kay-ld-orbit pointer-events-none absolute inset-0 animate-spin [animation-duration:1.1s]">
          <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(184,154,106,0.25)"
              strokeWidth="1.75"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#b0894a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray="70 220"
            />
          </svg>
        </div>

        <div
          className="relative overflow-hidden"
          style={{ width: px, height: px }}
        >
          <Image
            src="/brand/icon-512.png"
            alt=""
            width={px}
            height={px}
            className={`kay-ld-mark-light h-full w-full object-contain ${forceDark ? "hidden" : ""}`}
            priority
          />
          <Image
            src="/brand/icon-dark-256.png"
            alt=""
            width={px}
            height={px}
            className={`kay-ld-mark-dark h-full w-full object-contain ${forceDark ? "!block" : ""}`}
            priority
          />
          <span
            className="kay-ld-shine pointer-events-none absolute inset-[-35%] mix-blend-screen"
            style={{
              background:
                "linear-gradient(115deg, transparent 36%, rgba(255,236,200,0.7) 49%, transparent 62%)",
            }}
            aria-hidden
          />
        </div>
      </div>

      <div className="flex w-[min(11rem,58vw)] flex-col items-center gap-3">
        <p className="kay-ld-tag m-0 inline-flex items-center text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a734f]">
          <span style={{ textIndent: "0.28em" }}>{status}</span>
          <span className="ml-2 inline-flex items-center gap-1" aria-hidden>
            <span className="kay-ld-dot inline-block h-[3.5px] w-[3.5px] rounded-full bg-current" />
            <span className="kay-ld-dot inline-block h-[3.5px] w-[3.5px] rounded-full bg-current" />
            <span className="kay-ld-dot inline-block h-[3.5px] w-[3.5px] rounded-full bg-current" />
          </span>
        </p>
        <div
          className="relative h-[2px] w-full overflow-hidden rounded-full"
          aria-hidden
        >
          <span className="absolute inset-0 bg-[rgba(176,137,74,0.22)]" />
          <span
            className="kay-ld-rail-fill absolute top-0 bottom-0 left-0 w-[42%] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #b0894a 25%, #d4b07a 50%, #b0894a 75%, transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );

  if (!stage) return body;

  return (
    <div
      className={`kay-ld-stage fixed inset-0 z-[9990] grid min-h-dvh w-full place-items-center overflow-hidden bg-[#f7f4ee] ${
        forceDark ? "bg-[#050505]" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-[-20%]"
        style={{
          background:
            "radial-gradient(ellipse 42% 32% at 50% 46%, rgba(184,154,106,0.2), transparent 68%)",
        }}
        aria-hidden
      />
      {body}
    </div>
  );
}

/** Full-viewport soft veil used for global busy state. */
export function KayLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[9990]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <KayLoader size="lg" stage label="Loading" />
    </div>
  );
}
