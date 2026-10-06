import { MESSI_QUOTES } from "@/lib/tribute";

export function MessiQuoteMarquee() {
  const items = [...MESSI_QUOTES, ...MESSI_QUOTES];
  return (
    <div className="kay-messi-marquee" aria-label="Words from the number 10">
      <div className="kay-messi-marquee-track">
        {items.map((quote, i) => (
          <p
            key={`${i}-${quote.slice(0, 12)}`}
            className="flex shrink-0 items-center gap-4 font-serif text-[14px] italic text-kay-fg/80 sm:text-[15px]"
            aria-hidden={i >= MESSI_QUOTES.length}
          >
            <span className="not-italic text-kay-gold">10</span>
            &ldquo;{quote}&rdquo;
          </p>
        ))}
      </div>
    </div>
  );
}
