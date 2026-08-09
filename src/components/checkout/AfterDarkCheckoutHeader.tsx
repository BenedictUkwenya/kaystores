import Link from "next/link";
import { IconLock } from "@/components/ui/Icons";
import { Logo } from "@/components/brand/Logo";
import { AFTER_DARK_ROUTES } from "@/lib/after-dark/catalog";

export function AfterDarkCheckoutHeader() {
  return (
    <header className="mb-8 lg:mb-10">
      <div className="mb-6">
        <Logo
          href={AFTER_DARK_ROUTES.home}
          variant="dark"
          size="sm"
          label="Kay After Dark — Home"
          tagline="After Dark"
        />
      </div>

      <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-white/45">
        <Link
          href={AFTER_DARK_ROUTES.home}
          className="transition-colors hover:text-white/80"
        >
          After Dark
        </Link>
        <span>/</span>
        <span className="text-white/70">Private checkout</span>
      </nav>

      <h1 className="mt-4 font-serif text-[32px] leading-tight text-white sm:text-[40px]">
        Private checkout
      </h1>

      <p className="mt-2 flex items-center gap-2 text-[13px] text-ad-amber/90">
        <IconLock className="h-3.5 w-3.5 shrink-0" />
        Encrypted session · Discreet fulfilment · No public order history
      </p>
    </header>
  );
}
