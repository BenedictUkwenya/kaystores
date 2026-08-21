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
import { findVariationOption } from "@/lib/products/variations";

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
    options?: { openDrawer?: boolean; variationOptionId?: string; size?: string },
  ) => void;
  removeItem: (productId: string, variationOptionId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variationOptionId?: string,
  ) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(productId: string, variationOptionId?: string) {
  return variationOptionId ? `${productId}::${variationOptionId}` : productId;
}

function lineKey(item: CartItem) {
  return cartKey(item.productId, item.variationOptionId ?? item.size);
}

function productToCartItem(
  product: Product,
  quantity: number,
  variationOptionId?: string,
): CartItem {
  const option = findVariationOption(product.variation, variationOptionId);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: product.images[0] ?? "/images/kay-hero-luxury-box.png",
    quantity,
    maxStock: option?.stock ?? product.stock_quantity,
    vendorId: product.vendor_id ?? null,
    segment: getProductSegment(product),
    ...(option
      ? {
          variationLabel: product.variation?.label,
          variationOptionId: option.id,
          variationOptionLabel: option.label,
          size: option.label,
        }
      : {}),
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
      options?: {
        openDrawer?: boolean;
        variationOptionId?: string;
        size?: string;
      },
    ) => {
      if (!product.in_stock || product.stock_quantity <= 0) return;
      const variation = product.variation;
      const optionId =
        options?.variationOptionId ||
        (options?.size
          ? variation?.options.find((o) => o.label === options.size)?.id
          : undefined);
      if (variation?.options.length && !optionId) return;
      const option = findVariationOption(variation, optionId);
      if (option && option.stock <= 0) return;

      setItems((prev) => {
        const key = cartKey(product.id, optionId);
        const existing = prev.find((i) => lineKey(i) === key);
        const maxQty = option?.stock ?? product.stock_quantity;
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, maxQty);
          if (nextQty === existing.quantity) return prev;
          return prev.map((i) =>
            lineKey(i) === key ? { ...i, quantity: nextQty } : i,
          );
        }
        return [
          ...prev,
          productToCartItem(product, Math.min(quantity, maxQty), optionId),
        ];
      });
      if (options?.openDrawer !== false) setIsOpen(true);
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, variationOptionId?: string) => {
      setItems((prev) =>
        prev.filter((i) => lineKey(i) !== cartKey(productId, variationOptionId)),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variationOptionId?: string) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((i) => {
          if (lineKey(i) !== cartKey(productId, variationOptionId)) return i;
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
