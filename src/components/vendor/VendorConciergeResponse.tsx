"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MAX_OFFER_IMAGES } from "@/lib/storage/concierge-attachments";
import type { VendorConciergeItem } from "@/types/concierge";

type Props = {
  item: VendorConciergeItem;
};

export function VendorConciergeResponse({ item }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(item.vendorNotes);
  const [quotedPrice, setQuotedPrice] = useState(
    item.quotedPrice != null ? String(item.quotedPrice) : "",
  );
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const responded = item.status !== "pending";
  const notSelected = item.outcome === "not_chosen";

  async function respond(
    status: "has_product" | "no_product" | "need_more_info",
  ) {
    if (status === "has_product" && !quotedPrice.trim()) {
      alert("Please enter your quoted price when you have the product.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("assignmentId", item.assignmentId);
      formData.append("requestId", item.requestId);
      formData.append("status", status);
      formData.append("vendorNotes", notes);
      if (quotedPrice.trim()) formData.append("quotedPrice", quotedPrice);
      images.forEach((file) => formData.append("offerImages", file));

      const res = await fetch("/api/vendor/concierge", {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  if (notSelected) {
    return (
      <p className="text-[12px] text-kay-muted">
        The client chose another partner for this request.
      </p>
    );
  }

  if (responded) {
    return (
      <div className="space-y-2 text-[12px] text-kay-muted">
        <p className="capitalize font-medium text-kay-fg">
          Your response: {item.status.replace(/_/g, " ")}
          {item.outcome === "selected" && " · Selected by client"}
        </p>
        {item.quotedPrice != null && (
          <p>Quoted price: ₦{item.quotedPrice.toLocaleString()}</p>
        )}
        {item.vendorNotes && <p className="whitespace-pre-wrap">{item.vendorNotes}</p>}
        {item.offerImages.length > 0 && (
          <p>{item.offerImages.length} product photo(s) submitted</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        label="Notes for Kay (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Availability, lead time, condition…"
      />
      <Input
        label="Quoted price (₦)"
        type="number"
        min={1}
        value={quotedPrice}
        onChange={(e) => setQuotedPrice(e.target.value)}
        placeholder="Required if you have the product"
      />
      <div>
        <p className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
          Product photos (up to {MAX_OFFER_IMAGES})
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          multiple
          onChange={(e) =>
            setImages(Array.from(e.target.files ?? []).slice(0, MAX_OFFER_IMAGES))
          }
          className="w-full text-[12px] text-kay-muted"
        />
        {images.length > 0 && (
          <p className="mt-1 text-[11px] text-kay-subtle">
            {images.map((f) => f.name).join(", ")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => respond("has_product")}
          className="w-full"
        >
          I have this product
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => respond("no_product")}
          className="w-full"
        >
          I don&apos;t have it
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => respond("need_more_info")}
          className="w-full"
        >
          Need more info
        </Button>
      </div>
    </div>
  );
}
