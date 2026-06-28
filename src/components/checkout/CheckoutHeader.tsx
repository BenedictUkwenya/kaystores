import Link from "next/link";
import { IconLock } from "@/components/ui/Icons";

export function CheckoutHeader() {
  return (
    <header className="mb-8 lg:mb-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-kay-subtle">
        <Link href="/gifts" className="transition-colors hover:text-kay-fg">
          Gifts
        </Link>
        <span>/</span>
        <span className="text-kay-muted">Bag</span>
        <span>/</span>
        <span className="text-kay-fg">Checkout</span>
      </nav>

      <h1 className="mt-4 font-serif text-[32px] leading-tight text-kay-fg sm:text-[40px]">
        Checkout
      </h1>

      <p className="mt-2 flex items-center gap-2 text-[13px] text-emerald-700">
        <IconLock className="h-3.5 w-3.5 shrink-0" />
        Your transaction is protected with end-to-end encryption
      </p>
    </header>
  );
}
