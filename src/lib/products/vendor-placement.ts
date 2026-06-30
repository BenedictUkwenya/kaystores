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

  const { tags: _tags, ...rest } = body;
  return {
    ...rest,
    ...placement,
  };
}
