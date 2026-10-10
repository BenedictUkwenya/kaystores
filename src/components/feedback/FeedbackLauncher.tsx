"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN = [
  "/admin",
  "/vendor",
  "/checkout",
  "/login",
  "/signup",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/handover",
  "/reveal",
  "/split",
  "/feedback",
];

function hiddenPath(pathname: string) {
  return HIDDEN.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function FeedbackLauncher() {
  const pathname = usePathname();
  if (hiddenPath(pathname)) return null;

  return (
    <Link href="/feedback" className="kay-fb-launcher" aria-label="Give feedback">
      <span className="kay-fb-launcher-mark" aria-hidden>
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
