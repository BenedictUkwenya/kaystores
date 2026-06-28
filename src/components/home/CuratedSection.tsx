"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/shop/ProductCard";
import { IconArrowRight } from "@/components/ui/Icons";

type CuratedSectionProps = {
  products: Product[];
};

const AUTO_MS = 4000;
const GAP_PX = 16;

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 3L5 8L10 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CuratedSection({ products }: CuratedSectionProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = products.length;
  const canSlide = count > 1;

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function measure() {
      const card = viewport!.querySelector<HTMLElement>("[data-slide]");
      if (card) setCardWidth(card.getBoundingClientRect().width);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [products]);

  useEffect(() => {
    if (!canSlide || paused || reduceMotion) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, AUTO_MS);

    return () => window.clearInterval(id);
  }, [canSlide, paused, reduceMotion, count]);

  function goTo(next: number) {
    setIndex(((next % count) + count) % count);
  }

  function goNext() {
    goTo(index + 1);
  }

  function goPrev() {
    goTo(index - 1);
  }

  const step = cardWidth > 0 ? cardWidth + GAP_PX : 0;

  if (count === 0) return null;

  return (
    <section
      className="bg-kay-bg px-4 py-12 lg:px-10 lg:py-16"
      aria-roledescription="carousel"
      aria-label="Curated for you"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[28px] text-kay-fg">Curated for you</h2>
          <Link
            href="/gifts"
            className="flex items-center gap-1 text-[13px] font-medium text-kay-muted transition-colors hover:text-kay-fg"
          >
            View all
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative mt-8">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-kay-bg to-transparent sm:w-12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-kay-bg to-transparent sm:w-16"
            aria-hidden
          />

          <div
            ref={viewportRef}
            className="overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            <div
              className="flex will-change-transform"
              style={{
                gap: `${GAP_PX}px`,
                transform: step ? `translateX(-${index * step}px)` : undefined,
                transition: reduceMotion
                  ? "none"
                  : "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  data-slide
                  className="w-[72vw] shrink-0 sm:w-[240px] md:w-[260px] lg:w-[280px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {canSlide && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous products"
                className="absolute left-0 top-[42%] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-kay-border bg-kay-bg/95 text-kay-fg shadow-md backdrop-blur-sm transition-all hover:border-kay-fg hover:bg-kay-surface sm:flex"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next products"
                className="absolute right-0 top-[42%] z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-kay-border bg-kay-bg/95 text-kay-fg shadow-md backdrop-blur-sm transition-all hover:border-kay-fg hover:bg-kay-surface sm:flex"
              >
                <IconArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-5 flex items-center justify-center gap-2">
                {products.map((product, i) => (
                  <button
                    key={product.id}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-6 bg-kay-fg"
                        : "w-1.5 bg-kay-border hover:bg-kay-muted"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
