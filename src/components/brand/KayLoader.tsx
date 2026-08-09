"use client";

type KayLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  variant?: "light" | "dark" | "auto";
  className?: string;
};

const sizes = {
  sm: 28,
  md: 44,
  lg: 64,
} as const;

/**
 * Quiet brand hold — shimmer across the mark (no spinner ring).
 */
export function KayLoader({
  size = "md",
  label = "",
  variant = "auto",
  className = "",
}: KayLoaderProps) {
  const px = sizes[size];

  return (
    <div
      className={`kay-loader kay-loader--${variant} inline-flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      <span className="kay-loader-frame" style={{ width: px, height: px }}>
        <span className="kay-loader-mark" style={{ width: px, height: px }} />
        <span className="kay-loader-shine" aria-hidden />
      </span>
      {label ? <span className="kay-loader-label">{label}</span> : null}
    </div>
  );
}

/** Full-viewport soft veil used for global busy state. */
export function KayLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="kay-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <KayLoader size="lg" />
    </div>
  );
}
