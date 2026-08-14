import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { VendorApplyForm } from "@/components/vendor/VendorApplyForm";
import { VendorApplicationStatus } from "@/components/vendor/VendorApplicationStatus";
import { KaySuspenseFallback } from "@/components/brand/KaySuspenseFallback";
import { getSessionUser, getVendorByUserId } from "@/lib/auth/roles";
import {
  IconCheckCircle,
  IconDiamond,
  IconPackage,
  IconShield,
} from "@/components/ui/Icons";

type Props = {
  searchParams: Promise<{ reapply?: string; token?: string }>;
};

export default async function VendorApplyPage({ searchParams }: Props) {
  const params = await searchParams;
  const reapply = params.reapply === "1";
  const user = await getSessionUser();
  const vendor = user ? await getVendorByUserId(user.id) : null;

  if (vendor?.status === "approved") {
    redirect("/vendor");
  }

  if (vendor && vendor.status !== "rejected" && !reapply) {
    return (
      <AccountLayout
        eyebrow="Partner with Kay"
        title="Vendor application"
        description="Your application status with the Kay vendor network."
      >
        <VendorApplicationStatus vendor={vendor} />
      </AccountLayout>
    );
  }

  if (vendor?.status === "rejected" && !reapply) {
    return (
      <AccountLayout
        eyebrow="Partner with Kay"
        title="Vendor application"
        description="Your application status with the Kay vendor network."
      >
        <VendorApplicationStatus vendor={vendor} />
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      eyebrow="Partner with Kay"
      title="Become a vendor"
      description="Join a curated luxury gifting network. Kay reviews every application for fit, quality, and trust."
    >
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <IconDiamond className="h-4 w-4" />,
            title: "Curated storefront",
            text: "Your products appear beside Kay’s white-glove catalogue.",
          },
          {
            icon: <IconPackage className="h-4 w-4" />,
            title: "Hub fulfilment",
            text: "Deliver to our hub — we handle QC, packaging, and delivery.",
          },
          {
            icon: <IconShield className="h-4 w-4" />,
            title: "Trusted payouts",
            text: "Clear wallet balances after QC, with secure withdrawals.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[var(--kay-card-shadow)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kay-surface text-kay-gold">
              {item.icon}
            </div>
            <p className="mt-3 text-[13px] font-medium text-kay-fg">{item.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-kay-gold/30 bg-kay-gold-light/20 px-4 py-3 text-[13px] text-kay-fg">
        <IconCheckCircle className="h-4 w-4 text-kay-gold" />
        Already approved?{" "}
        <Link href="/vendor" className="font-medium text-kay-gold hover:underline">
          Go to vendor portal
        </Link>
        <span className="text-kay-subtle">·</span>
        <Link
          href="/login?next=/vendor/apply"
          className="font-medium text-kay-gold hover:underline"
        >
          Sign in
        </Link>
        <span className="text-kay-subtle">·</span>
        <Link
          href="/signup?intent=vendor"
          className="font-medium text-kay-gold hover:underline"
        >
          Sign up & apply
        </Link>
      </div>

      <div className="rounded-[24px] border border-kay-border-light bg-kay-surface-elevated p-5 shadow-[var(--kay-card-shadow)] sm:p-8">
        <Suspense fallback={<KaySuspenseFallback />}>
          <VendorApplyForm />
        </Suspense>
      </div>
    </AccountLayout>
  );
}
