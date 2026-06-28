import Link from "next/link";
import { IconArrowRight } from "@/components/ui/Icons";

type PaginationProps = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  page: number,
  searchParams?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {page > 1 && (
        <Link
          href={buildHref(basePath, page - 1, searchParams)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-kay-border text-kay-fg transition-colors hover:bg-kay-surface"
          aria-label="Previous page"
        >
          <IconArrowRight className="rotate-180" />
        </Link>
      )}
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const showEllipsis = prev != null && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {showEllipsis && (
              <span className="px-2 text-kay-subtle">…</span>
            )}
            <Link
              href={buildHref(basePath, p, searchParams)}
              className={`flex h-9 min-w-[36px] items-center justify-center rounded-md px-2 text-[13px] font-medium transition-colors ${
                p === page
                  ? "bg-kay-accent text-kay-accent-fg"
                  : "border border-kay-border text-kay-fg hover:bg-kay-surface"
              }`}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages && (
        <Link
          href={buildHref(basePath, page + 1, searchParams)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-kay-border text-kay-fg transition-colors hover:bg-kay-surface"
          aria-label="Next page"
        >
          <IconArrowRight />
        </Link>
      )}
    </nav>
  );
}
