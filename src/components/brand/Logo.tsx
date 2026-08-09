import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Mark aspect ~0.5 (width/height) after tight crop — fixed slot so themes don't shift. */
const dimensions = {
  sm: { height: 26, text: "text-[20px]" },
  md: { height: 32, text: "text-[26px]" },
  lg: { height: 40, text: "text-[32px]" },
} as const;

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { height, text } = dimensions[size];
  const width = Math.round(height * 0.5);
  const style = {
    "--logo-h": `${height}px`,
    "--logo-w": `${width}px`,
  } as React.CSSProperties;

  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center text-kay-fg ${className}`}
      aria-label="Kay Stores — Home"
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
    </Link>
  );
}
