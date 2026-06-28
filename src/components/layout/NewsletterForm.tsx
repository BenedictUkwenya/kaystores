"use client";

import { IconArrowRight } from "@/components/ui/Icons";

export function NewsletterForm() {
  return (
    <form
      className="mt-4 flex"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <input
        type="email"
        placeholder="Your email"
        className="h-11 flex-1 rounded-l-md border border-kay-border bg-kay-input-bg px-3 text-[13px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-md bg-kay-accent text-kay-accent-fg transition-opacity hover:opacity-85"
      >
        <IconArrowRight />
      </button>
    </form>
  );
}
