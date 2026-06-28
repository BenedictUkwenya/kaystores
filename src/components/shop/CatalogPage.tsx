import type { CollectionConfig } from "@/lib/shop/collections";
import type { ProductSort } from "@/types/product";
import { getDistinctBrands, getProducts } from "@/lib/products/queries";
import { CatalogHeader } from "@/components/shop/CatalogHeader";
import { CatalogFilters } from "@/components/shop/CatalogFilters";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Pagination } from "@/components/shop/Pagination";

type CatalogPageProps = {
  config: CollectionConfig;
  basePath: string;
  searchParams: Record<string, string | undefined>;
};

function parseSort(value?: string): ProductSort {
  if (
    value === "price-asc" ||
    value === "price-desc" ||
    value === "name-asc"
  ) {
    return value;
  }
  return "newest";
}

function buildFiltersFromParams(
  config: CollectionConfig,
  searchParams: Record<string, string | undefined>,
) {
  const filters = { ...config.filters };

  if (searchParams.q) filters.search = searchParams.q;
  if (searchParams.brand)
    filters.brands = searchParams.brand.split(",").filter(Boolean);
  if (searchParams.minPrice)
    filters.minPrice = Number(searchParams.minPrice);
  if (searchParams.maxPrice)
    filters.maxPrice = Number(searchParams.maxPrice);

  const urlOccasions = searchParams.occasion?.split(",").filter(Boolean);
  const urlRecipients = searchParams.recipient?.split(",").filter(Boolean);

  if (urlOccasions?.length) {
    filters.occasions = [
      ...(filters.occasions ?? []),
      ...urlOccasions,
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

  if (urlRecipients?.length) {
    filters.recipients = [
      ...(filters.recipients ?? []),
      ...urlRecipients,
    ].filter((v, i, a) => a.indexOf(v) === i);
  }

  return filters;
}

export async function CatalogPage({
  config,
  basePath,
  searchParams,
}: CatalogPageProps) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const sort = parseSort(searchParams.sort);
  const filters = buildFiltersFromParams(config, searchParams);

  const [result, brands] = await Promise.all([
    getProducts({ filters, sort, page }),
    getDistinctBrands(),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-5 sm:px-10 lg:px-14 lg:py-6">
      <CatalogHeader
        title={config.title}
        description={config.description}
        total={result.total}
        breadcrumbs={config.breadcrumbs}
        sort={sort}
        basePath={basePath}
        searchParams={searchParams}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr] lg:gap-10 xl:grid-cols-[240px_1fr]">
        <CatalogFilters
          basePath={basePath}
          brands={brands}
          searchParams={searchParams}
          showOccasions={!config.filters.occasions?.length}
          showRecipients={!config.filters.recipients?.length}
        />

        <div>
          <ProductGrid products={result.products} />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={basePath}
            searchParams={searchParams}
          />
        </div>
      </div>
    </div>
  );
}
