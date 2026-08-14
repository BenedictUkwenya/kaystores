import { Header } from "@/components/layout/Header";
import { DashboardNavAttentionProvider } from "@/components/dashboard/DashboardNavAttention";
import { getProfileRole, getSessionUser } from "@/lib/auth/roles";
import { resolveAdminNavAttention } from "@/lib/dashboard/nav-attention";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const role = user ? await getProfileRole(user.id) : null;
  const attention =
    role === "admin" ? await resolveAdminNavAttention() : {};

  return (
    <>
      <Header />
      <DashboardNavAttentionProvider attention={attention}>
        <main className="min-h-[70vh] flex-1 bg-kay-bg">{children}</main>
      </DashboardNavAttentionProvider>
    </>
  );
}
