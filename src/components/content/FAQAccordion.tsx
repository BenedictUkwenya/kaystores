"use client";

import { useState } from "react";
import { IconChevronDown } from "@/components/ui/Icons";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: readonly FAQItem[];
};

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-kay-border-light rounded-2xl border border-kay-border-light bg-kay-surface-elevated">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-kay-surface/60"
              aria-expanded={isOpen}
            >
              <span className="font-medium text-kay-fg">{item.question}</span>
              <IconChevronDown
                className={`mt-1 shrink-0 text-kay-subtle transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5 text-[14px] leading-relaxed text-kay-muted">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
