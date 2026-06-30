"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ProductImageUpload } from "@/components/vendor/ProductImageUpload";
import { ProductPlacementPicker } from "@/components/vendor/ProductPlacementPicker";
import {
  compareAtPriceFromDiscount,
  discountPercentFromPrices,
} from "@/lib/products/discount";
import { slugifyProductName } from "@/lib/products/slug";
import { hasAnyPlacement } from "@/lib/shop/taxonomy";
import { MAX_PRODUCT_IMAGES } from "@/lib/storage/product-images";
import { formatNaira } from "@/lib/data/home";
import type { Product } from "@/types/product";

type Props = {
  product?: Product;
  vendorId: string;
  canListAfterDark: boolean;
};

type SlugStatus = "idle" | "checking" | "available" | "taken";

export function VendorProductForm({
  product,
  vendorId,
  canListAfterDark,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product?.slug));
  const [sku, setSku] = useState(product?.sku ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [discountPercent, setDiscountPercent] = useState(
    String(
      discountPercentFromPrices(
        product?.price ?? 0,
        product?.compare_at_price ?? null,
      ),
    ),
  );
  const [stockQuantity, setStockQuantity] = useState(
    String(product?.stock_quantity ?? 0),
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [placement, setPlacement] = useState({
    occasions: product?.occasions ?? [],
    recipients: product?.recipients ?? [],
    collections: product?.collections ?? [],
  });
  const [segment, setSegment] = useState<"gifting" | "after_dark">(
    (product?.segment as "gifting" | "after_dark") ?? "gifting",
  );
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slugTouched && name.trim()) {
      setSlug(slugifyProductName(name));
    }
  }, [name, slugTouched]);

  const resolvedSlug = slugifyProductName(slug.trim() || slugifyProductName(name));
  const salePrice = Number(price) || 0;
  const discount = Number(discountPercent) || 0;
  const compareAtPrice = compareAtPriceFromDiscount(salePrice, discount);

  useEffect(() => {
    if (!resolvedSlug) {
      setSlugStatus("idle");
      setSlugSuggestions([]);
      return;
    }
    if (isEdit && product?.slug === resolvedSlug) {
      setSlugStatus("available");
      setSlugSuggestions([]);
      return;
    }
    setSlugStatus("checking");
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ slug: resolvedSlug });
        if (product?.id) params.set("excludeProductId", product.id);
        const res = await fetch(`/api/vendor/products/check-slug?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Check failed");
        setSlugStatus(data.available ? "available" : "taken");
        setSlugSuggestions(data.suggestions ?? []);
      } catch {
        setSlugStatus("idle");
        setSlugSuggestions([]);
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [resolvedSlug, isEdit, product?.slug, product?.id]);

  async function handleSubmit(e: React.FormEvent, publish = false) {
    e.preventDefault();
    setError(null);

    if (slugStatus === "taken") {
      setError(
        slugSuggestions.length
          ? `This product link is already taken. Try: ${slugSuggestions.join(", ")}`
          : "This product link is already taken. Please choose another.",
      );
      return;
    }

    if (publish && images.length === 0) {
      setError("Add at least one product photo before publishing.");
      return;
    }

    if (publish && !hasAnyPlacement(placement)) {
      setError(
        "Choose at least one shop category (occasion, recipient, or collection) before publishing.",
      );
      return;
    }

    if (images.length > MAX_PRODUCT_IMAGES) {
      setError(`Maximum ${MAX_PRODUCT_IMAGES} photos allowed.`);
      return;
    }

    const qty = Math.max(0, Math.floor(Number(stockQuantity) || 0));
    if (qty < 1) {
      setError("Enter how many units you have in stock (at least 1).");
      return;
    }

    if (discount < 0 || discount >= 100) {
      setError("Promo discount must be between 1% and 99%, or leave it at 0.");
      return;
    }

    setLoading(true);

    const payload = {
      name,
      slug: resolvedSlug,
      sku,
      brand,
      description,
      price: salePrice,
      compareAtPrice,
      images,
      stockQuantity: qty,
      occasions: placement.occasions,
      recipients: placement.recipients,
      collections: placement.collections,
      segment: canListAfterDark ? segment : "gifting",
      publish,
    };

    try {
      const url = isEdit
        ? `/api/vendor/products/${product!.id}`
        : "/api/vendor/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      router.push("/vendor/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function applySlugSuggestion(next: string) {
    setSlugTouched(true);
    setSlug(next);
  }

  const publishReady = {
    photos: images.length > 0,
    stock: Number(stockQuantity) >= 1,
    placement: hasAnyPlacement(placement),
    price: salePrice > 0,
  };

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="space-y-5 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 shadow-[var(--kay-card-shadow)] sm:p-8"
    >
      {product?.rejection_reason && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          Rejected: {product.rejection_reason}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        />
      </div>

      <Input
        label="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        hint="Your internal stock code — customers won't see this"
        required
      />

      <ProductImageUpload
        vendorId={vendorId}
        images={images}
        onChange={setImages}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Price (₦)"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          hint="What the customer pays today"
          required
        />
        <Input
          label="Promo discount (%)"
          type="number"
          min={0}
          max={99}
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          hint='Optional "awoof" — e.g. 20 for 20% off'
        />
      </div>

      {compareAtPrice != null && salePrice > 0 && discount > 0 && (
        <p className="rounded-lg border border-kay-gold/25 bg-kay-gold-light/20 px-4 py-3 text-[13px] text-kay-fg">
          Shoppers will see{" "}
          <span className="line-through text-kay-subtle">
            {formatNaira(compareAtPrice)}
          </span>{" "}
          → <span className="font-semibold">{formatNaira(salePrice)}</span>{" "}
          <span className="text-kay-gold">({discount}% off)</span>
        </p>
      )}

      <Input
        label="Units in stock"
        type="number"
        min={0}
        value={stockQuantity}
        onChange={(e) => setStockQuantity(e.target.value)}
        hint="Kay reduces this automatically when someone buys"
        required
      />

      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        required
      />

      <ProductPlacementPicker
        value={placement}
        onChange={setPlacement}
        productName={name}
        productDescription={description}
        productBrand={brand}
        productPrice={salePrice}
      />

      <div className="rounded-xl border border-kay-border-light bg-kay-surface/50 px-4 py-3">
        <p className="text-[12px] text-kay-muted">
          <span className="font-medium text-kay-fg">Product link</span> — the
          web address shoppers use to find this gift.
        </p>
        <p className="mt-2 font-mono text-[12px] text-kay-subtle">
          /products/{resolvedSlug || "your-product-name"}
        </p>
        {slugStatus === "checking" && (
          <p className="mt-2 text-[12px] text-kay-muted">Checking link…</p>
        )}
        {slugStatus === "available" && resolvedSlug && (
          <p className="mt-2 text-[12px] text-green-700">This link is available.</p>
        )}
        {slugStatus === "taken" && (
          <div className="mt-2">
            <p className="text-[12px] text-red-600">
              This link is already taken by another product on Kay.
            </p>
            {slugSuggestions.length > 0 && (
              <p className="mt-2 text-[12px] text-kay-muted">
                Try:{" "}
                {slugSuggestions.map((s, i) => (
                  <span key={s}>
                    {i > 0 && ", "}
                    <button
                      type="button"
                      onClick={() => applySlugSuggestion(s)}
                      className="font-medium text-kay-gold hover:underline"
                    >
                      {s}
                    </button>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowLinkOptions((o) => !o)}
          className="mt-2 text-[12px] font-medium text-kay-gold hover:underline"
        >
          {showLinkOptions ? "Hide custom link" : "Customise link"}
        </button>
        {showLinkOptions && (
          <div className="mt-3">
            <Input
              label="Custom link (slug)"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              hint='Lowercase words with hyphens only, e.g. "silk-scarf-set"'
              error={slugStatus === "taken" ? "Link already taken" : undefined}
            />
          </div>
        )}
      </div>

      {canListAfterDark ? (
        <div>
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
            Catalogue segment
          </label>
          <select
            value={segment}
            onChange={(e) =>
              setSegment(e.target.value as "gifting" | "after_dark")
            }
            className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px]"
          >
            <option value="gifting">Luxury gifting</option>
            <option value="after_dark">After Dark (trusted vendors)</option>
          </select>
        </div>
      ) : (
        <p className="text-[12px] text-kay-muted">
          After Dark listings require trusted vendor status. Contact Kay admin to
          apply.
        </p>
      )}

      <div className="rounded-lg border border-kay-border-light bg-kay-surface/30 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-kay-subtle">
          Ready to publish?
        </p>
        <ul className="mt-2 space-y-1 text-[12px] text-kay-muted">
          <li>{publishReady.photos ? "✓" : "○"} At least one photo</li>
          <li>{publishReady.stock ? "✓" : "○"} Stock quantity set</li>
          <li>{publishReady.placement ? "✓" : "○"} Shop categories chosen</li>
          <li>{publishReady.price ? "✓" : "○"} Price set</li>
        </ul>
      </div>

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="submit"
          disabled={loading || slugStatus === "taken"}
          className="w-full sm:w-auto"
        >
          {loading ? "Saving…" : "Save draft"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading || slugStatus === "taken"}
          onClick={(e) => handleSubmit(e, true)}
          className="w-full sm:w-auto"
        >
          Save & publish
        </Button>
      </div>
    </form>
  );
}
