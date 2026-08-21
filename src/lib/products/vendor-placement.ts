import {
  hasAnyPlacement,
  sanitizePlacementArrays,
} from "@/lib/shop/taxonomy";
import type { VendorProductInput } from "@/lib/vendors/repository";

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
  if (
    body.publish &&
    (!body.shippingWeightKg ||
      !body.shippingLengthCm ||
      !body.shippingWidthCm ||
      !body.shippingHeightCm ||
      body.shippingWeightKg <= 0 ||
      body.shippingLengthCm <= 0 ||
      body.shippingWidthCm <= 0 ||
      body.shippingHeightCm <= 0)
  ) {
    throw new Error("Packaged weight and dimensions are required before publishing.");
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
  return {
    ...rest,
    ...placement,
  };
}
