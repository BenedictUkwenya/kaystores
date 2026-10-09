type KayMarkProps = {
  className?: string;
  spin?: boolean;
};

/** Gold ring, serif K, one spark. */
export function KayMark({ className, spin = false }: KayMarkProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className={spin ? "kay-ai-ring" : undefined}
      />
      <path
        d="M16 14h8.2c4.2 0 6.8 2.2 6.8 5.4 0 2.4-1.5 4.2-3.8 5l4.6 9.6h-4.2l-4-8.6H19.6V34H16V14zm3.6 8.6h4.2c2 0 3.2-1 3.2-2.6s-1.2-2.5-3.2-2.5h-4.2v5.1z"
        fill="currentColor"
      />
      <circle cx="36.5" cy="11" r="2.1" fill="currentColor" className={spin ? "kay-ai-spark" : undefined} />
    </svg>
  );
}
