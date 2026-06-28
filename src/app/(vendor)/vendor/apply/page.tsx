import { Suspense } from "react";
import Link from "next/link";
import { AccountLayout } from "@/components/account/AccountLayout";
import { VendorApplyForm } from "@/components/vendor/VendorApplyForm";

export default function VendorApplyPage() {
  return (
    <AccountLayout
      eyebrow="Partner with Kay"
      title="Become a vendor"
      description="Join our curated vendor network. List luxury gifting and wellness products — handpicked for quality, not volume."
    >
      <p className="mb-6 text-[13px] text-kay-muted">
        Already approved?{" "}
        <Link href="/vendor" className="font-medium text-kay-gold hover:underline">
          Go to vendor portal
        </Link>
        {" · "}
        <Link href="/login?next=/vendor/apply" className="font-medium text-kay-gold hover:underline">
          Sign in
        </Link>
      </p>
      <Suspense fallback={<p className="text-kay-muted">Loading…</p>}>
        <VendorApplyForm />
      </Suspense>
    </AccountLayout>
  );
}
