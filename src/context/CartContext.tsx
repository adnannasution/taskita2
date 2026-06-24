import React, { createContext, useContext, useState } from 'react';
import type { Product } from '../types';

export interface CartItem {
  product: Product;
  qty: number;
}

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, qty: number) => string | null;
  updateQty: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(product: Product, qty: number): string | null {
    let error: string | null = null;
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      const currentQty = existing?.qty ?? 0;
      const newQty = currentQty + qty;
      if (newQty > product.stock) {
        error = `Stok tidak cukup (tersedia: ${product.stock})`;
        return prev;
      }
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, qty: newQty } : i);
      }
      return [...prev, { product, qty }];
    });
    return error;
  }

  function updateQty(productId: number, qty: number) {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, qty } : i));
  }

  function removeItem(productId: number) {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }

  function clearCart() { setItems([]); }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
