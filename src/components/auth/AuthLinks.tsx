"use client";

import Link from "next/link";

type AuthFooterLinkProps = {
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

export function AuthFooterLinks({ primary, secondary }: AuthFooterLinkProps) {
  return (
    <p className="mt-6 text-center text-[13px] text-kay-muted">
      {secondary && (
        <>
          {secondary.label}{" "}
          <Link
            href={secondary.href}
            className="font-medium text-kay-fg underline-offset-2 hover:underline"
          >
            {secondary.href.includes("signup") ? "Sign up" : secondary.href.includes("login") ? "Sign in" : "here"}
          </Link>
          {" · "}
        </>
      )}
      {primary.label}{" "}
      <Link
        href={primary.href}
        className="font-medium text-kay-gold underline-offset-2 hover:underline"
      >
        {primary.href.includes("forgot") ? "Reset" : primary.href.includes("signup") ? "Sign up" : "Sign in"}
      </Link>
    </p>
  );
}

// Simpler explicit links
export function AuthLinkRow({
  left,
  right,
}: {
  left: { text: string; href: string; linkText: string };
  right?: { text: string; href: string; linkText: string };
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-kay-muted">
      <span>
        {left.text}{" "}
        <Link href={left.href} className="text-kay-fg underline hover:opacity-70">
          {left.linkText}
        </Link>
      </span>
      {right && (
        <span>
          {right.text}{" "}
          <Link href={right.href} className="text-kay-gold underline hover:opacity-70">
            {right.linkText}
          </Link>
        </span>
      )}
    </div>
  );
}
