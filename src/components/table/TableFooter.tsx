import Link from "next/link";
import { TABLE_CATEGORIES, TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";
import { SITE_ROUTES } from "@/lib/data/site-routes";
import { Logo } from "@/components/brand/Logo";
import {
  IconFacebook,
  IconInstagram,
  IconPinterest,
} from "@/components/ui/Icons";

export function TableFooter() {
  return (
    <footer className="border-t border-[var(--table-line)] bg-[var(--table-paper)]">
      <div className="mx-auto max-w-[1280px] px-4 py-14 lg:px-10 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-baseline">
              <Logo
                href={TABLE_ROUTES.home}
                size="md"
                label={`${TABLE_COPY.brand} — Home`}
              />
              <span
                className="ml-2.5 border-l border-[var(--table-line)] pl-2.5 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--table-muted)]"
                aria-hidden
              >
                Kitchen
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[var(--table-muted)]">
              Edible gifts from trusted bakers and chocolatiers — ready to send,
              or crafted to your brief.
            </p>
            <div className="mt-5 flex gap-4 text-[var(--table-muted)]">
              <a href="#" aria-label="Instagram" className="hover:text-[var(--table-ink)]">
                <IconInstagram />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-[var(--table-ink)]">
                <IconFacebook />
              </a>
              <a href="#" aria-label="Pinterest" className="hover:text-[var(--table-ink)]">
                <IconPinterest />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-[var(--table-ink)]">
              Browse
            </h3>
            <ul className="mt-4 space-y-2.5">
              {TABLE_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/table?tag=${cat.tag}`}
                    className="text-[13px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={TABLE_ROUTES.request}
                  className="text-[13px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
                >
                  Custom cake
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-[var(--table-ink)]">
              About
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href={TABLE_ROUTES.about}
                  className="text-[13px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
                >
                  Kay Kitchen
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-[13px] text-[var(--table-muted)] transition-colors hover:text-[var(--table-ink)]"
                >
                  Kay Stores
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold text-[var(--table-ink)]">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-[var(--table-muted)]">
              <li>
                <a
                  href="mailto:concierge@kaystores.ng"
                  className="transition-colors hover:text-[var(--table-ink)]"
                >
                  concierge@kaystores.ng
                </a>
              </li>
              <li>Lagos, Nigeria</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--table-line)] pt-8 text-[11px] text-[var(--table-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kay Stores. Kay Kitchen.</p>
          <div className="flex gap-4">
            <Link href={SITE_ROUTES.privacy} className="hover:text-[var(--table-ink)]">
              Privacy Policy
            </Link>
            <Link href={SITE_ROUTES.terms} className="hover:text-[var(--table-ink)]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
