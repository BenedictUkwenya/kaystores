import type { Product } from "@/types/product";

/** Kay client-facing markup on vendor/list prices (covers shipping & handling). */
export const CLIENT_MARKUP_RATE = 0.15;

export function applyClientMarkup(vendorPrice: number): number {
  if (vendorPrice <= 0) return 0;
  return Math.round(vendorPrice * (1 + CLIENT_MARKUP_RATE));
}

/** Convert a client-facing filter bound to the vendor price stored in the DB. */
export function vendorPriceBoundFromClient(clientPrice: number): number {
  return Math.floor(clientPrice / (1 + CLIENT_MARKUP_RATE));
}

export function applyClientMarkupToProduct(product: Product): Product {
  const price = applyClientMarkup(product.price);
  const compare_at_price =
    product.compare_at_price != null
      ? applyClientMarkup(product.compare_at_price)
      : null;

  return {
    ...product,
    price,
    compare_at_price:
      compare_at_price != null && compare_at_price > price
        ? compare_at_price
        : compare_at_price,
  };
}

export function applyClientMarkupToProducts(products: Product[]): Product[] {
  return products.map(applyClientMarkupToProduct);
}
