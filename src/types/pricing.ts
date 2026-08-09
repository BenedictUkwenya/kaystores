export type MarkupTier = {
  id: string;
  minPrice: number;
  maxPrice: number | null;
  rate: number;
  flatFee: number;
  label: string | null;
  sortOrder: number;
  active: boolean;
};
