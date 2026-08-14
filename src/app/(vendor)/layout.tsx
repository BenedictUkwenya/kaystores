import { Header } from "@/components/layout/Header";
import { DashboardNavAttentionProvider } from "@/components/dashboard/DashboardNavAttention";
import {
  getProfileRole,
  getSessionUser,
  getVendorByUserId,
} from "@/lib/auth/roles";
import { resolveVendorNavAttention } from "@/lib/dashboard/nav-attention";

export default async function VendorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const role = user ? await getProfileRole(user.id) : null;
  let attention = {};

  if (role === "vendor" && user) {
    const vendor = await getVendorByUserId(user.id);
    if (vendor?.status === "approved") {
      attention = await resolveVendorNavAttention(vendor.id);
    }
  }

  return (
    <>
      <Header />
      <DashboardNavAttentionProvider attention={attention}>
        <main className="min-h-[70vh] flex-1 bg-kay-bg">{children}</main>
      </DashboardNavAttentionProvider>
    </>
  );
}
