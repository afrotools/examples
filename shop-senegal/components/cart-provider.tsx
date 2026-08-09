"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, CartState, Product } from "@/types";

type CartAction =
  | { type: "ADD_ITEM"; product: Product }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "HYDRATE":
      return action.items;

    case "ADD_ITEM": {
      const existing = state.find((i) => i.product.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.product.id === action.product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...state, { product: action.product, quantity: 1 }];
    }

    case "REMOVE_ITEM":
      return state.filter((i) => i.product.id !== action.productId);

    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return state.filter((i) => i.product.id !== action.productId);
      }
      return state.map((i) =>
        i.product.id === action.productId
          ? { ...i, quantity: action.quantity }
          : i
      );

    case "CLEAR_CART":
      return [];

    default:
      return state;
  }
}

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = "afrotools-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount — client only
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        dispatch({ type: "HYDRATE", items: parsed });
      }
    } catch {
      // Malformed storage — ignore
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on every change (after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        addItem: (product) => dispatch({ type: "ADD_ITEM", product }),
        removeItem: (productId) =>
          dispatch({ type: "REMOVE_ITEM", productId }),
        updateQuantity: (productId, quantity) =>
          dispatch({ type: "UPDATE_QUANTITY", productId, quantity }),
        clearCart: () => dispatch({ type: "CLEAR_CART" }),
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
