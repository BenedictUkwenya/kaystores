import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="text-kay-muted">Loading…</p>}>
      <SignupForm />
    </Suspense>
  );
}
