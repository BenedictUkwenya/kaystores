import {
  hasAnyPlacement,
  sanitizePlacementArrays,
} from "@/lib/shop/taxonomy";
import type { VendorProductInput } from "@/lib/vendors/repository";
import { defaultParcelFor } from "@/lib/shipping/parcel-defaults";

export function prepareVendorProductInput(
  body: VendorProductInput,
): VendorProductInput {
  const placement = sanitizePlacementArrays({
    occasions: body.occasions,
    recipients: body.recipients,
    collections: body.collections,
  });

  if (body.publish && !hasAnyPlacement(placement)) {
    throw new Error(
      "Choose at least one category (occasion, recipient, or collection) before publishing.",
    );
  }
  if (body.publish) {
    const size = defaultParcelFor({
      productType: body.productType,
      masterCategory: body.masterCategory,
      name: body.name,
    });
    const orDefault = (value: number | undefined, def: number) =>
      value != null && value > 0 ? value : def;
    body = {
      ...body,
      shippingWeightKg: orDefault(body.shippingWeightKg, size.weightKg),
      shippingLengthCm: orDefault(body.shippingLengthCm, size.lengthCm),
      shippingWidthCm: orDefault(body.shippingWidthCm, size.widthCm),
      shippingHeightCm: orDefault(body.shippingHeightCm, size.heightCm),
    };
  }

  if (
    body.publish &&
    (!body.productType ||
      !body.masterCategory ||
      !body.color ||
      !body.condition ||
      !body.audience)
  ) {
    throw new Error(
      "Searchable tags (category, type, color, condition, audience) are required before publishing.",
    );
  }

  if (
    body.publish &&
    (body.vendorOriginalPrice == null || body.vendorOriginalPrice <= 0)
  ) {
    throw new Error("Vendor original price is required before publishing.");
  }

  const { tags: _tags, ...rest } = body;
  const derivedTags: string[] = [];
  if (placement.collections.includes("table") && body.productType) {
    const typeTag = body.productType.trim().toLowerCase();
    if (typeTag) derivedTags.push(typeTag);
  }

  return {
    ...rest,
    ...placement,
    tags: derivedTags.length ? derivedTags : undefined,
  };
}
