import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { FOOTER_SHOP_LINKS } from "@/lib/data/home";
import {
  FOOTER_ABOUT_LINKS,
  FOOTER_HELP_LINKS,
  SITE_ROUTES,
} from "@/lib/data/site-routes";
import {
  IconFacebook,
  IconInstagram,
  IconPinterest,
} from "@/components/ui/Icons";

export function Footer() {
  return (
    <footer className="border-t border-kay-border bg-kay-bg">
      <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-3 text-[13px] leading-relaxed text-kay-muted">
              Making every gift meaningful.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="#" aria-label="Instagram" className="text-kay-muted transition-colors hover:text-kay-fg">
                <IconInstagram />
              </a>
              <a href="#" aria-label="Facebook" className="text-kay-muted transition-colors hover:text-kay-fg">
                <IconFacebook />
              </a>
              <a href="#" aria-label="Pinterest" className="text-kay-muted transition-colors hover:text-kay-fg">
                <IconPinterest />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold tracking-wide text-kay-fg">Shop</h3>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(FOOTER_SHOP_LINKS).map(([item, href]) => (
                <li key={item}>
                  <Link href={href} className="text-[13px] text-kay-muted transition-colors hover:text-kay-fg">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold tracking-wide text-kay-fg">Help</h3>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(FOOTER_HELP_LINKS).map(([item, href]) => (
                <li key={item}>
                  <Link href={href} className="text-[13px] text-kay-muted transition-colors hover:text-kay-fg">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold tracking-wide text-kay-fg">About</h3>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(FOOTER_ABOUT_LINKS).map(([item, href]) => (
                <li key={item}>
                  <Link href={href} className="text-[13px] text-kay-muted transition-colors hover:text-kay-fg">
                    {item}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={SITE_ROUTES.concierge}
                  className="text-[13px] text-kay-muted transition-colors hover:text-kay-fg"
                >
                  Inquire about Concierge Services
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-serif text-[18px] text-kay-fg">Join the Kay Circle</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-kay-muted">
              Be the first to know about new arrivals, exclusive offers, and gifting inspiration.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-kay-border pt-8 text-[12px] text-kay-muted sm:flex-row">
          <p>© 2025 Kay Stores. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href={SITE_ROUTES.privacy} className="transition-colors hover:text-kay-fg">
              Privacy Policy
            </Link>
            <Link href={SITE_ROUTES.terms} className="transition-colors hover:text-kay-fg">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
