export function AfterDarkSegmentBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`ad-segment-badge inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${className}`}
    >
      After Dark
    </span>
  );
}
