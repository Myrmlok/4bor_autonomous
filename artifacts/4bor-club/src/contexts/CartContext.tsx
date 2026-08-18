import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Lot } from '../data/mock';

export interface CartItem {
  lot: Lot;
  quantity: 1; // монеты всегда по 1 штуке
  addedAt: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  addItem: (lot: Lot) => void;
  removeItem: (lotId: string) => void;
  clearCart: () => void;
  hasItem: (lotId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = '4bor_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (lot: Lot) => {
    setItems(prev => {
      if (prev.some(i => i.lot.id === lot.id)) return prev;
      return [...prev, { lot, quantity: 1, addedAt: new Date().toISOString() }];
    });
  };

  const removeItem = (lotId: string) => {
    setItems(prev => prev.filter(i => i.lot.id !== lotId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const hasItem = (lotId: string) => items.some(i => i.lot.id === lotId);

  return (
    <CartContext.Provider value={{ items, count: items.length, addItem, removeItem, clearCart, hasItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
