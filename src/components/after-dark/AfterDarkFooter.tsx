import Link from "next/link";
import {
  AFTER_DARK_FOOTER_ABOUT,
  AFTER_DARK_FOOTER_SHOP,
  AFTER_DARK_ROUTES,
} from "@/lib/after-dark/catalog";
import { SITE_ROUTES } from "@/lib/data/site-routes";
import { Logo } from "@/components/brand/Logo";
import {
  IconFacebook,
  IconInstagram,
  IconPinterest,
} from "@/components/ui/Icons";

export function AfterDarkFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-[1280px] px-4 py-14 lg:px-10 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo
              href={AFTER_DARK_ROUTES.home}
              variant="dark"
              size="md"
              label="Kay After Dark — Home"
              tagline="After Dark"
            />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/55">
              Discreet luxury for mature audiences. Anonymous packaging, confidential
              handling, and curated intimacy — by invitation to the dark.
            </p>
            <div className="mt-5 flex gap-4 text-white/45">
              <a href="#" aria-label="Instagram" className="hover:text-ad-amber">
                <IconInstagram />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-ad-amber">
                <IconFacebook />
              </a>
              <a href="#" aria-label="Pinterest" className="hover:text-ad-amber">
                <IconPinterest />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-white">Shop</h3>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(AFTER_DARK_FOOTER_SHOP).map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-white/55 transition-colors hover:text-ad-amber"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-white">About</h3>
            <ul className="mt-4 space-y-2.5">
              {Object.entries(AFTER_DARK_FOOTER_ABOUT).map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13px] text-white/55 transition-colors hover:text-ad-amber"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-white">Contact</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-white/55">
              <li>
                <a
                  href="mailto:concierge@kaystores.ng"
                  className="transition-colors hover:text-ad-amber"
                >
                  concierge@kaystores.ng
                </a>
              </li>
              <li>
                <Link
                  href={AFTER_DARK_ROUTES.contact}
                  className="transition-colors hover:text-ad-amber"
                >
                  Contact form
                </Link>
              </li>
              <li>Lagos, Nigeria</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kay Stores. 18+ only.</p>
          <div className="flex gap-4">
            <Link href={SITE_ROUTES.privacy} className="hover:text-ad-amber">
              Privacy Policy
            </Link>
            <Link href={SITE_ROUTES.terms} className="hover:text-ad-amber">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-ad-amber">
              Kay Stores
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
