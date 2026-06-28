import Link from "next/link";
import { ContactForm } from "@/components/content/ContactForm";
import { AFTER_DARK_ROUTES } from "@/lib/after-dark/catalog";

export const metadata = {
  title: "Contact — Kay After Dark",
};

export default function AfterDarkContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 lg:px-10 lg:py-20">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ad-amber">
        Confidential enquiries
      </p>
      <h1 className="mt-3 font-serif text-[28px] text-white sm:text-[36px]">Contact us</h1>
      <p className="mt-4 text-[14px] leading-relaxed text-white/65">
        Questions about sizing, discretion, or a private request? Our concierge
        team responds within one business day. All After Dark enquiries are handled
        confidentially.
      </p>

      <div className="after-dark-contact-form mt-10 rounded-xl border border-white/10 bg-[#141414] p-6 sm:p-8">
        <ContactForm />
      </div>

      <p className="mt-8 text-[13px] text-white/45">
        Prefer email?{" "}
        <a
          href="mailto:concierge@kaystores.ng"
          className="text-ad-amber hover:underline"
        >
          concierge@kaystores.ng
        </a>
        . Or return to{" "}
        <Link href={AFTER_DARK_ROUTES.home} className="text-ad-amber hover:underline">
          Kay After Dark
        </Link>
        .
      </p>
    </div>
  );
}
