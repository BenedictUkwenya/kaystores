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
  addItem: (product: Product, quantity?: number, options?: { openDrawer?: boolean }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function productToCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.images[0] ?? "/images/kay-hero-luxury-box.png",
    quantity,
    vendorId: product.vendor_id ?? null,
    segment: getProductSegment(product),
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
    (product: Product, quantity = 1, options?: { openDrawer?: boolean }) => {
      if (!product.in_stock) return;
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i,
          );
        }
        return [...prev, productToCartItem(product, quantity)];
      });
      if (options?.openDrawer !== false) setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      ),
    );
  }, []);

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
