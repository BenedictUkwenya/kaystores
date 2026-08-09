import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/roles";
import { SupportChat } from "@/components/support/SupportChat";

export default async function SupportPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/support");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <SupportChat />
      <p className="mt-6 text-center text-[13px] text-kay-muted">
        Prefer email?{" "}
        <Link href="/contact" className="text-kay-fg underline-offset-2 hover:underline">
          Use the contact form
        </Link>
        .
      </p>
    </div>
  );
}
