import { AuthShell } from "@/components/auth/AuthShell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-kay-bg">
      <AuthShell>{children}</AuthShell>
    </div>
  );
}
