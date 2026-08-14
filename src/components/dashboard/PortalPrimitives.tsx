import type { ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight } from "@/components/ui/Icons";

type SectionProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
};

export function PortalSection({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className = "",
}: SectionProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)] ${className}`}
    >
      <div className="flex flex-col gap-3 border-b border-kay-border-light px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="font-serif text-[22px] leading-tight text-kay-fg">{title}</h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-kay-muted">
              {description}
            </p>
          )}
        </div>
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-kay-gold hover:underline"
          >
            {actionLabel}
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

type ActionCardProps = {
  href: string;
  title: string;
  description: string;
  icon?: ReactNode;
  tone?: "default" | "gold" | "ink";
};

export function PortalActionCard({
  href,
  title,
  description,
  icon,
  tone = "default",
}: ActionCardProps) {
  const toneClass =
    tone === "gold"
      ? "border-kay-gold/35 bg-kay-gold-light/25 hover:border-kay-gold"
      : tone === "ink"
        ? "border-transparent bg-[#111111] text-white hover:bg-[#1a1a1a]"
        : "border-kay-border-light bg-kay-surface-elevated hover:border-kay-gold/40";

  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-2xl border p-4 shadow-[var(--kay-card-shadow)] transition-all ${toneClass}`}
    >
      {icon && (
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            tone === "ink"
              ? "bg-white/10 text-kay-gold"
              : "bg-kay-surface text-kay-gold"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span
          className={`block text-[14px] font-medium ${
            tone === "ink" ? "text-white" : "text-kay-fg"
          }`}
        >
          {title}
        </span>
        <span
          className={`mt-1 block text-[12px] leading-relaxed ${
            tone === "ink" ? "text-white/65" : "text-kay-muted"
          }`}
        >
          {description}
        </span>
      </span>
    </Link>
  );
}

type QueueItemProps = {
  href: string;
  title: string;
  meta: string;
  badge?: ReactNode;
  icon?: ReactNode;
};

export function PortalQueueItem({
  href,
  title,
  meta,
  badge,
  icon,
}: QueueItemProps) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 border-b border-kay-border-light px-5 py-4 transition-colors last:border-b-0 hover:bg-kay-surface/60 sm:px-6"
    >
      {icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-kay-surface text-kay-gold">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-kay-fg">{title}</span>
          {badge}
        </span>
        <span className="mt-1 block text-[12px] text-kay-muted">{meta}</span>
      </span>
      <IconArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-kay-subtle" />
    </Link>
  );
}
