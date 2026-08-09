import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Destination — defaults to storefront home. */
  href?: string;
  /** Force mark colors; `auto` follows `[data-theme]`. */
  variant?: "auto" | "light" | "dark";
  /** Accessible name for the link. */
  label?: string;
  /** Optional line under/beside the wordmark (e.g. After Dark). */
  tagline?: string;
};

/** Mark aspect ~0.5 (width/height) after tight crop — fixed slot so themes don't shift. */
const dimensions = {
  sm: { height: 26, text: "text-[20px]", tag: "text-[8px]" },
  md: { height: 32, text: "text-[26px]", tag: "text-[9px]" },
  lg: { height: 40, text: "text-[32px]", tag: "text-[10px]" },
} as const;

export function Logo({
  size = "md",
  className = "",
  href = "/",
  variant = "auto",
  label = "Kay Stores — Home",
  tagline,
}: LogoProps) {
  const { height, text, tag } = dimensions[size];
  const width = Math.round(height * 0.5);
  const style = {
    "--logo-h": `${height}px`,
    "--logo-w": `${width}px`,
  } as React.CSSProperties;

  const variantClass =
    variant === "dark"
      ? "kay-logo-root--dark text-white"
      : variant === "light"
        ? "kay-logo-root--light text-kay-fg"
        : "text-kay-fg";

  return (
    <Link
      href={href}
      className={`kay-logo-root inline-flex shrink-0 items-center ${variantClass} ${className}`}
      aria-label={label}
      style={style}
    >
      <span className="kay-logo-slot relative inline-block h-[var(--logo-h)] w-[var(--logo-w)] shrink-0">
        <Image
          src="/brand/kay-logo-light.png"
          alt=""
          width={width}
          height={height}
          priority
          unoptimized
          aria-hidden
          className="kay-logo kay-logo--light"
        />
        <Image
          src="/brand/kay-logo-dark.png"
          alt=""
          width={width}
          height={height}
          priority
          unoptimized
          aria-hidden
          className="kay-logo kay-logo--dark"
        />
      </span>
      <span
        className={`ml-0.5 -translate-y-[0.22em] font-serif font-medium leading-none tracking-[-0.04em] ${text}`}
        aria-hidden
      >
        ay
      </span>
      {tagline ? (
        <span
          className={`ml-2.5 hidden border-l border-ad-amber/35 pl-2.5 font-sans font-medium uppercase tracking-[0.2em] text-ad-amber sm:inline ${tag}`}
        >
          {tagline}
        </span>
      ) : null}
    </Link>
  );
}
