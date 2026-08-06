import { Suspense } from "react";
import Link from "next/link";
import { AccountLayout } from "@/components/account/AccountLayout";
import { VendorApplyForm } from "@/components/vendor/VendorApplyForm";

export default function VendorApplyPage() {
  return (
    <AccountLayout
      eyebrow="Partner with Kay"
      title="Become a vendor"
      description="Apply to join our curated vendor network — or sign up at /signup with “Apply as vendor”. Kay reviews every application."
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
        {" · "}
        <Link href="/signup?intent=vendor" className="font-medium text-kay-gold hover:underline">
          Sign up & apply
        </Link>
      </p>
      <Suspense fallback={<p className="text-kay-muted">Loading…</p>}>
        <VendorApplyForm />
      </Suspense>
    </AccountLayout>
  );
}
