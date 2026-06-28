import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const dimensions = {
  sm: { width: 64, height: 24 },
  md: { width: 80, height: 30 },
  lg: { width: 96, height: 36 },
} as const;

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { width, height } = dimensions[size];

  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="Kay Stores — Home"
    >
      <Image
        src="/brand/kay-logo.png"
        alt="Kay"
        width={width}
        height={height}
        priority
        unoptimized
        className="kay-logo h-[var(--logo-h)] w-auto"
        style={{ "--logo-h": `${height}px` } as React.CSSProperties}
      />
    </Link>
  );
}
