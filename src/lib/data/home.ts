export const NAV_LINKS = [
  { label: "Gifts", hasDropdown: true },
  { label: "By Occasion", hasDropdown: true },
  { label: "By Recipient", hasDropdown: true },
  { label: "Luxury Collection", hasDropdown: false },
  { label: "Corporate Gifting", hasDropdown: false },
] as const;

export const HERO_TRUST_BADGES = [
  { icon: "truck", label: "Fast & Reliable Delivery" },
  { icon: "package", label: "Luxury Packaging" },
  { icon: "shield", label: "Secure Payments" },
  { icon: "refresh", label: "Hassle-Free Returns" },
] as const;

export const AI_SUGGESTIONS = [
  "For my boyfriend's birthday",
  "Gift for a new mom",
  "Luxury gift for my boss",
] as const;

export const SHOP_CATEGORIES = [
  { label: "For Her", icon: "handbag" },
  { label: "For Him", icon: "watch" },
  { label: "For Parents", icon: "parents" },
  { label: "For Friends", icon: "gift" },
  { label: "For Kids", icon: "teddy" },
  { label: "Corporate Gifts", icon: "briefcase" },
] as const;

export const CURATED_PRODUCTS = [
  {
    id: "1",
    name: "Tom Ford - Black Orchid",
    price: 185000,
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop",
  },
  {
    id: "2",
    name: "Luxury Travel Gift Set",
    price: 95000,
    image:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=500&fit=crop",
  },
  {
    id: "3",
    name: "Kay Signature Hamper",
    price: 150000,
    image:
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=500&fit=crop",
  },
  {
    id: "4",
    name: "Baublebar Initial Necklace",
    price: 55000,
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop",
  },
  {
    id: "5",
    name: "Premium Scented Candle Set",
    price: 42000,
    image:
      "https://images.unsplash.com/photo-1602607894039-8a177834a14c?w=400&h=500&fit=crop",
  },
] as const;

export const PRESS_LOGOS = [
  "VOGUE",
  "Forbes",
  "GLAMOUR",
  "BellaNaija",
  "BUSINESS DAY",
] as const;

export const VALUE_PROPS = [
  {
    icon: "diamond",
    title: "Premium Quality",
    subtitle: "Only the best",
  },
  {
    icon: "ribbon",
    title: "Beautiful Packaging",
    subtitle: "Made to impress",
  },
  {
    icon: "truck",
    title: "Nationwide Delivery",
    subtitle: "Fast & reliable",
  },
  {
    icon: "gift-wrap",
    title: "Gift Wrapping",
    subtitle: "At no extra cost",
  },
] as const;

export const FOOTER_SHOP_LINKS: Record<string, string> = {
  "All Gifts": "/gifts",
  "New Arrivals": "/gifts?sort=newest",
  "Best Sellers": "/gifts",
  "Luxury Collection": "/gifts/luxury-collection",
  "Corporate Gifts": "/gifts/corporate-gifting",
  "Gift Cards": "/gifts",
};

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
