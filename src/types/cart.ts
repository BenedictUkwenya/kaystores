export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
};
