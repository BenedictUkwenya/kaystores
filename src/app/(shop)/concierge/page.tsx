import Link from "next/link";
import { ConciergeForm } from "@/components/concierge/ConciergeForm";
import { ConciergeSidebar } from "@/components/concierge/ConciergeSidebar";

export default function ConciergePage() {
  return (
    <div className="concierge-page mx-auto max-w-[1140px] px-4 py-6 sm:px-10 lg:px-12 lg:py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-kay-subtle">
        <Link href="/" className="transition-colors hover:text-kay-fg">
          Home
        </Link>
        <span className="text-kay-border">/</span>
        <span className="text-kay-fg">Concierge Sourcing</span>
      </nav>

      <header className="mt-5 max-w-2xl border-b border-kay-border-light pb-6">
        <h1 className="font-serif text-[32px] leading-tight text-kay-fg sm:text-[38px]">
          Concierge Sourcing Request
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-kay-muted">
          Need help finding something special? Tell us what you&apos;re looking
          for — we&apos;ll source exclusive luxury gifts, limited editions, and
          hard-to-find pieces on your behalf.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ConciergeForm />
        <ConciergeSidebar />
      </div>
    </div>
  );
}
