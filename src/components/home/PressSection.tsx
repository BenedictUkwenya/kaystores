import { PRESS_LOGOS } from "@/lib/data/home";

export function PressSection() {
  return (
    <section className="border-y border-kay-border-light bg-kay-bg px-6 py-10 lg:px-10">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-10 gap-y-6 lg:justify-between">
        {PRESS_LOGOS.map((logo) => (
          <span
            key={logo}
            className="font-serif text-[15px] tracking-[0.15em] text-kay-subtle uppercase opacity-70 transition-opacity hover:opacity-100 sm:text-[16px]"
            style={{
              fontFamily:
                logo === "Forbes"
                  ? "Georgia, serif"
                  : logo === "VOGUE"
                    ? "var(--font-playfair), serif"
                    : undefined,
              fontWeight: logo === "BUSINESS DAY" ? 600 : 400,
              letterSpacing: logo === "BellaNaija" ? "0.02em" : undefined,
              textTransform: logo === "BellaNaija" ? "none" : "uppercase",
            }}
          >
            {logo}
          </span>
        ))}
      </div>
    </section>
  );
}
