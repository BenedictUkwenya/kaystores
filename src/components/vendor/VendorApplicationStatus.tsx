import Link from "next/link";
import type { Vendor } from "@/types/dashboard";

type Props = {
  vendor: Vendor;
};

export function VendorApplicationStatus({ vendor }: Props) {
  const isPending = vendor.status === "pending";
  const isRejected = vendor.status === "rejected";
  const isSuspended = vendor.status === "suspended";

  const title = isPending
    ? "Application under review"
    : isRejected
      ? "Application not approved"
      : isSuspended
        ? "Vendor access suspended"
        : "Vendor application";

  const body = isPending
    ? "Our team is reviewing your vendor application. You’ll get an email when you’re approved or if we need anything else — usually within 1–2 business days."
    : isRejected
      ? "We weren’t able to approve this application. You can update your details and apply again, or contact Kay if you think this was a mistake."
      : isSuspended
        ? "Your vendor portal access is paused. Contact Kay support for next steps."
        : "Track your partnership status with Kay.";

  return (
    <div className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-8 shadow-[var(--kay-card-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kay-gold">
        Vendor partnership
      </p>
      <h1 className="mt-3 font-serif text-[28px] text-kay-fg sm:text-[32px]">
        {title}
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">{body}</p>

      <dl className="mt-8 space-y-3 border-t border-kay-border-light pt-6 text-[13px]">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-kay-subtle">Business</dt>
          <dd className="font-medium text-kay-fg">{vendor.businessName}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-kay-subtle">Status</dt>
          <dd className="font-medium capitalize text-kay-fg">{vendor.status}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-kay-subtle">Submitted</dt>
          <dd className="font-medium text-kay-fg">
            {new Date(vendor.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/account"
          className="inline-flex h-11 items-center justify-center rounded-full border border-kay-fg px-6 text-[13px] font-medium text-kay-fg"
        >
          Back to account
        </Link>
        {isRejected ? (
          <Link
            href="/vendor/apply?reapply=1"
            className="inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-6 text-[13px] font-medium text-kay-accent-fg"
          >
            Update & reapply
          </Link>
        ) : null}
        {vendor.status === "approved" ? (
          <Link
            href="/vendor"
            className="inline-flex h-11 items-center justify-center rounded-full bg-kay-accent px-6 text-[13px] font-medium text-kay-accent-fg"
          >
            Open vendor portal
          </Link>
        ) : null}
      </div>
    </div>
  );
}
