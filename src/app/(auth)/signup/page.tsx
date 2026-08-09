import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";
import { KaySuspenseFallback } from "@/components/brand/KaySuspenseFallback";

export default function SignupPage() {
  return (
    <Suspense fallback={<KaySuspenseFallback />}>
      <SignupForm />
    </Suspense>
  );
}
