import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-kay-muted">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
