import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, WishlistItem } from '../types.js';
import { useAuth } from './AuthContext.js';
import api from '../services/api.js';

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchWishlist();
  }, [user, forceRefresh]);

  const addItem = async (product: Product) => {
    if (!user || !user.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      console.log('Adding product to wishlist:', { productId: product.id, userId: user.id });
      const response = await api.post(`/wishlist/${user.id}`, {
        productId: product.id
      });

      const newItem: WishlistItem = {
        product,
        added_at: new Date().toISOString(),
      };

      setItems(prev => [...prev, newItem]);
      setTotalItems(prev => prev + 1);
      setForceRefresh(prev => prev + 1); // Force refresh after adding
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      throw error; // Re-throw to handle in the component
    }
  };

  const removeItem = async (productId: string) => {
    if (!user || !user.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await api.delete(`/wishlist/${user.id}/${String(productId)}`);

      if (!response) {
        throw new Error('Failed to get response from server');
      }

      const data = response.data;
      if (data?.items && Array.isArray(data.items)) {
        setItems(data.items.map((item: any) => ({
          product: item.product,
          added_at: item.added_at
        })));
        setTotalItems(data.totalItems || 0);
      }

      // Optimistically update the UI
      setItems(prev => prev.filter(item => item.product.id !== productId));
      setTotalItems(prev => prev - 1);
      setForceRefresh(prev => prev + 1); // Force refresh after removing
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      // Refresh the wishlist to ensure UI is in sync
      fetchWishlist();
    }
  };

  const isInWishlist = (productId: string): boolean => {
    if (!items || !productId) return false;
    return items.some(item => item && item.product && item.product.id === productId);
  };

  const fetchWishlist = async () => {
    if (!user || !user.id) {
      setItems([]);
      setTotalItems(0);
      return;
    }

    try {
      console.log('Fetching wishlist for user:', user.id);
      const response = await api.get(`/wishlist/${user.id}`);
      const { items, totalItems } = response.data;
      setItems(items);
      setTotalItems(totalItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setItems([]);
      setTotalItems(0);
    }
  };

  const value = {
    items,
    addItem,
    removeItem,
    isInWishlist,
    totalItems,
    fetchWishlist: async () => await fetchWishlist(),
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}