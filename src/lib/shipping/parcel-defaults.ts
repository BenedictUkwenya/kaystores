/** Rough packaged weight/size used when a product has no shipping measurements. */

export type ParcelSize = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

const SMALL: ParcelSize = { weightKg: 0.5, lengthCm: 15, widthCm: 12, heightCm: 10 };
const JEWELRY: ParcelSize = { weightKg: 0.3, lengthCm: 12, widthCm: 10, heightCm: 6 };
const PHONE: ParcelSize = { weightKg: 0.6, lengthCm: 20, widthCm: 12, heightCm: 8 };
const SHOES: ParcelSize = { weightKg: 1.2, lengthCm: 35, widthCm: 22, heightCm: 13 };
const CLOTHING: ParcelSize = { weightKg: 0.8, lengthCm: 40, widthCm: 30, heightCm: 10 };
const BAG: ParcelSize = { weightKg: 1, lengthCm: 40, widthCm: 30, heightCm: 15 };
const BOUQUET: ParcelSize = { weightKg: 1.5, lengthCm: 45, widthCm: 45, heightCm: 55 };
const HAMPER: ParcelSize = { weightKg: 2.5, lengthCm: 45, widthCm: 35, heightCm: 30 };
const CAKE: ParcelSize = { weightKg: 3, lengthCm: 35, widthCm: 35, heightCm: 25 };
const TREAT: ParcelSize = { weightKg: 0.8, lengthCm: 25, widthCm: 20, heightCm: 10 };
const GENERIC: ParcelSize = { weightKg: 1, lengthCm: 30, widthCm: 25, heightCm: 15 };

const BY_TYPE: Record<string, ParcelSize> = {
  watch: SMALL,
  phone: PHONE,
  sneaker: SHOES,
  slide: SHOES,
  sandal: SHOES,
  loafer: SHOES,
  boot: { ...SHOES, weightKg: 1.8, heightCm: 15 },
  necklace: JEWELRY,
  bracelet: JEWELRY,
  ring: JEWELRY,
  earring: JEWELRY,
  bag: BAG,
  wallet: JEWELRY,
  perfume: SMALL,
  cake: CAKE,
  chocolate: TREAT,
  hamper: HAMPER,
  treat: TREAT,
};

const BY_CATEGORY: Record<string, ParcelSize> = {
  footwear: SHOES,
  jewelry: JEWELRY,
  phone: PHONE,
  watch: SMALL,
  bag: BAG,
  beauty: SMALL,
  edible: TREAT,
};

const BY_NAME: [RegExp, ParcelSize][] = [
  [/bouquet|flower|rose|bloom/i, BOUQUET],
  [/gown|dress|shirt|top|skirt|trouser|jacket|kaftan|agbada/i, CLOTHING],
  [/hamper|gift set|box set|basket/i, HAMPER],
  [/cake/i, CAKE],
  [/perfume|edp|edt|parfum|cologne/i, SMALL],
];

export function defaultParcelFor(product: {
  productType?: string | null;
  masterCategory?: string | null;
  name?: string | null;
}): ParcelSize {
  const type = product.productType?.trim().toLowerCase();
  if (type && BY_TYPE[type]) return BY_TYPE[type];
  const name = product.name ?? "";
  for (const [pattern, size] of BY_NAME) {
    if (pattern.test(name)) return size;
  }
  const category = product.masterCategory?.trim().toLowerCase();
  if (category && BY_CATEGORY[category]) return BY_CATEGORY[category];
  return GENERIC;
}
