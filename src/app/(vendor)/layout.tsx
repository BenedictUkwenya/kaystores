import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function VendorGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex-1 bg-kay-bg">{children}</main>
      <Footer />
    </>
  );
}
