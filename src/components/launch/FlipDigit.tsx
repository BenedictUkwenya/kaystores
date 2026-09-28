"use client";

type Props = {
  value: number;
  label: string;
  size?: "sm" | "md" | "lg";
  mounted: boolean;
};

const SIZES = {
  sm: "kay-flip--sm",
  md: "kay-flip--md",
  lg: "kay-flip--lg",
} as const;

export function FlipDigit({ value, label, size = "md", mounted }: Props) {
  const text = mounted ? String(value).padStart(2, "0") : "--";
  return (
    <div className={`kay-flip ${SIZES[size]}`}>
      <div className="kay-flip-card" aria-hidden>
        {/* key forces the flip animation to replay on each change */}
        <span key={text} className="kay-flip-value">
          {text}
        </span>
      </div>
      <span className="kay-flip-label">{label}</span>
    </div>
  );
}
