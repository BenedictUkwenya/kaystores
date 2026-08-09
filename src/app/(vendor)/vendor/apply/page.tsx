import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { VendorApplyForm } from "@/components/vendor/VendorApplyForm";
import { VendorApplicationStatus } from "@/components/vendor/VendorApplicationStatus";
import { KaySuspenseFallback } from "@/components/brand/KaySuspenseFallback";
import { getSessionUser, getVendorByUserId } from "@/lib/auth/roles";

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
      description="Apply to join our curated vendor network — or sign up at /signup with “Apply as vendor”. Kay reviews every application."
    >
      <p className="mb-6 text-[13px] text-kay-muted">
        Already approved?{" "}
        <Link href="/vendor" className="font-medium text-kay-gold hover:underline">
          Go to vendor portal
        </Link>
        {" · "}
        <Link
          href="/login?next=/vendor/apply"
          className="font-medium text-kay-gold hover:underline"
        >
          Sign in
        </Link>
        {" · "}
        <Link
          href="/signup?intent=vendor"
          className="font-medium text-kay-gold hover:underline"
        >
          Sign up & apply
        </Link>
      </p>
      <Suspense fallback={<KaySuspenseFallback />}>
        <VendorApplyForm />
      </Suspense>
    </AccountLayout>
  );
}
