"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/types/cart";
import type { Product } from "@/types/product";
import { getProductSegment } from "@/lib/pricing/segment";
import {
  cartItemCount,
  cartSubtotal,
  loadCart,
  saveCart,
} from "@/lib/cart/storage";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    product: Product,
    quantity?: number,
    options?: { openDrawer?: boolean; size?: string },
  ) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(productId: string, size?: string) {
  return size ? `${productId}::${size}` : productId;
}

function productToCartItem(
  product: Product,
  quantity: number,
  size?: string,
): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.images[0] ?? "/images/kay-hero-luxury-box.png",
    quantity,
    maxStock: product.stock_quantity,
    vendorId: product.vendor_id ?? null,
    segment: getProductSegment(product),
    ...(size ? { size } : {}),
  };
}

function normalizeCartItems(items: CartItem[]): CartItem[] {
  return items.map((item) => ({
    ...item,
    segment: item.segment ?? "gifting",
  }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadCart();
    setItems(normalizeCartItems(saved.items));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart({ items });
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  const addItem = useCallback(
    (
      product: Product,
      quantity = 1,
      options?: { openDrawer?: boolean; size?: string },
    ) => {
      if (!product.in_stock || product.stock_quantity <= 0) return;
      const sizes = product.size_options ?? [];
      if (sizes.length > 0 && !options?.size) return;
      const size = options?.size;
      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            cartKey(i.productId, i.size) === cartKey(product.id, size),
        );
        const maxQty = product.stock_quantity;
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, maxQty);
          if (nextQty === existing.quantity) return prev;
          return prev.map((i) =>
            cartKey(i.productId, i.size) === cartKey(product.id, size)
              ? { ...i, quantity: nextQty }
              : i,
          );
        }
        return [
          ...prev,
          productToCartItem(product, Math.min(quantity, maxQty), size),
        ];
      });
      if (options?.openDrawer !== false) setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) =>
      prev.filter((i) => cartKey(i.productId, i.size) !== cartKey(productId, size)),
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, size?: string) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((i) => {
          if (cartKey(i.productId, i.size) !== cartKey(productId, size)) return i;
          const cap = i.maxStock ?? quantity;
          return { ...i, quantity: Math.min(quantity, cap) };
        }),
      );
    },
    [],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      itemCount: cartItemCount(items),
      subtotal: cartSubtotal(items),
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
