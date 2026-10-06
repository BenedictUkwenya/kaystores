/** Inline golden football — crisp at any size, no background. */
export function GoldBall({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id="kay-gold-ball" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#f6e7bf" />
          <stop offset="45%" stopColor="#d2b479" />
          <stop offset="100%" stopColor="#8a6b3a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#kay-gold-ball)" />
      <g fill="#6f5327" opacity="0.85">
        <polygon points="50,30 62,39 57,53 43,53 38,39" />
        <polygon points="22,46 32,40 38,52 30,64 20,58" />
        <polygon points="78,46 68,40 62,52 70,64 80,58" />
        <polygon points="34,78 42,66 58,66 66,78 50,86" />
        <polygon points="40,10 50,16 60,10 56,4 44,4" />
      </g>
      <g stroke="#6f5327" strokeWidth="1.6" fill="none" opacity="0.6">
        <line x1="50" y1="30" x2="50" y2="16" />
        <line x1="38" y1="39" x2="32" y2="40" />
        <line x1="62" y1="39" x2="68" y2="40" />
        <line x1="43" y1="53" x2="42" y2="66" />
        <line x1="57" y1="53" x2="58" y2="66" />
      </g>
      <ellipse cx="36" cy="28" rx="12" ry="7" fill="#fff6dc" opacity="0.55" />
    </svg>
  );
}
