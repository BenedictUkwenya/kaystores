import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { KaySuspenseFallback } from "@/components/brand/KaySuspenseFallback";

export default function LoginPage() {
  return (
    <Suspense fallback={<KaySuspenseFallback />}>
      <LoginForm />
    </Suspense>
  );
}
