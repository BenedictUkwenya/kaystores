"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderFeedbackLink({
  variant = "light",
  className = "",
  onNavigate,
}: {
  variant?: "light" | "dark";
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === "/feedback" || pathname.startsWith("/feedback/");

  return (
    <Link
      href="/feedback"
      aria-label="Give feedback"
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`kay-fb-header ${variant === "dark" ? "kay-fb-header--dark" : ""} ${active ? "is-on" : ""} ${className}`}
    >
      <span className="kay-fb-header-mark" aria-hidden>
        <svg viewBox="0 0 24 24">
          <path
            d="M5 5.5h9.2a3.3 3.3 0 0 1 0 6.6H8.2L5 15.2V5.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8 8.2h6.2M8 10.6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>
      <span>Feedback</span>
    </Link>
  );
}
