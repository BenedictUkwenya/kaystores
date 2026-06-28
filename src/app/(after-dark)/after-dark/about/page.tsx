import Link from "next/link";
import { AFTER_DARK_ROUTES } from "@/lib/after-dark/catalog";

export const metadata = {
  title: "About — Kay After Dark",
};

export default function AfterDarkAboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-10 lg:py-20">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ad-amber">
        About Kay After Dark
      </p>
      <h1 className="mt-3 font-serif text-[28px] text-white sm:text-[36px]">
        Discretion is the ultimate luxury
      </h1>
      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-white/70">
        <p>
          Kay After Dark is our confidential edit for mature audiences — intimacy,
          wellness, and sensual gifts curated with the same white-glove standards
          as our main gifting catalogue.
        </p>
        <p>
          Every order ships in anonymous outer packaging. Billing descriptors are
          neutral. Recipient details are handled with confidentiality, and anonymous
          gifting is available at checkout.
        </p>
        <p>
          A separate minimum order value and curation fee apply to After Dark
          items, reflecting discreet hub vetting, sealed inner packaging, and
          priority confidential handling.
        </p>
        <p className="text-[13px] text-white/50">
          You must be 18 years or older to browse and purchase from this
          collection.
        </p>
      </div>
      <Link
        href={AFTER_DARK_ROUTES.shop}
        className="mt-10 inline-flex h-11 items-center justify-center rounded-lg bg-ad-amber px-8 text-[13px] font-semibold text-black"
      >
        Browse the collection
      </Link>
    </div>
  );
}
