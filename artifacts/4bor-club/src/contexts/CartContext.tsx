import React, {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import { cart as cartApi, type ApiCartItem, type ApiLot } from '../lib/api-client';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartLot {
  id: string;
  title: string;
  description: string;
  price?: number;
  bidMin?: number;
  bidMax?: number;
  bidsCount: number;
  format: 'fixed' | 'auction';
  status: 'active' | 'sold';
  imageUrl: string;
  themeId: string;
  groupId: string;
  sectionType: 'auction' | 'exclusive' | 'liquidation';
  createdAt: string;
}

interface CartContextValue {
  items:        CartLot[];
  count:        number;
  loading:      boolean;
  addItem:      (lot: CartLot) => Promise<void>;
  removeItem:   (lotId: string) => Promise<void>;
  clearCart:    () => Promise<void>;
  isInCart:     (lotId: string) => boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue>({
  items: [], count: 0, loading: false,
  addItem: async () => {}, removeItem: async () => {}, clearCart: async () => {},
  isInCart: () => false,
});

function apiLotToCartLot(l: ApiLot): CartLot {
  return {
    id: l.id, title: l.title, description: l.description,
    price: l.price, bidMin: l.bidMin, bidMax: l.bidMax, bidsCount: l.bidsCount,
    format: l.format, status: l.status, imageUrl: l.imageUrl,
    themeId: l.themeId, groupId: l.groupId,
    sectionType: l.sectionType, createdAt: l.createdAt,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems]     = useState<CartLot[]>([]);
  const [loading, setLoading] = useState(false);

  // Reload cart whenever the logged-in user changes
  useEffect(() => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    cartApi.get()
      .then(data => setItems(data.map(i => apiLotToCartLot(i.lot as ApiLot))))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  const addItem = useCallback(async (lot: CartLot) => {
    if (!user) return;
    await cartApi.add(lot.id);
    setItems(prev => prev.some(i => i.id === lot.id) ? prev : [...prev, lot]);
  }, [user]);

  const removeItem = useCallback(async (lotId: string) => {
    if (!user) return;
    await cartApi.remove(lotId);
    setItems(prev => prev.filter(i => i.id !== lotId));
  }, [user]);

  const clearCart = useCallback(async () => {
    if (!user) return;
    await cartApi.clear();
    setItems([]);
  }, [user]);

  const isInCart = useCallback((lotId: string) => items.some(i => i.id === lotId), [items]);

  return (
    <CartContext.Provider value={{
      items, count: items.length, loading, addItem, removeItem, clearCart, isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
