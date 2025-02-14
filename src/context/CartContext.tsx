import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Product, CartItem, CartProduct } from "../types.js";
import { useAuth } from "./AuthContext.js";
import api from "../services/api.js";

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    selectedColor?: string
  ) => Promise<void>;
  removeItem: (
    productId: string,
    selectedColor?: string,
    itemId?: string
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  loading: boolean;
  error: string | null;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  totalItems: 0,
  totalPrice: 0,
  isOpen: false,
  setIsOpen: () => {},
  loading: false,
  error: null,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Calculate total items and price
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce(
    (total, item) => total + (item.product?.price || 0) * item.quantity,
    0
  );

  // Load cart from database on mount and when user changes
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) {
        // If no user, load from localStorage
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            setItems(parsedCart);
          } catch (error) {
            console.error("Error parsing cart from localStorage:", error);
            localStorage.removeItem("cart"); // Clear invalid cart data
            setItems([]);
          }
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        console.log("Fetching cart for user:", user.id);
        const response = await api.get(`/carts/${user.id}`);
        console.log("Cart data received:", response.data);

        if (!response.data) {
          console.error("No data received from cart API");
          throw new Error("Failed to fetch cart data");
        }

        // Check if the response has a cart wrapper
        const cartData = response.data.cart;
        if (!cartData) {
          console.error("No cart data in response:", response.data);
          throw new Error("Invalid cart data format");
        }

        const cartItems = cartData.items || [];
        console.log("Cart items from API:", cartItems);

        // Map the items to ensure they have the correct structure
        const processedItems = cartItems
          .map((item: any) => {
            if (!item.product) {
              console.error("Cart item missing product data:", item);
              return null;
            }

            return {
              _id: item._id,
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.image,
                category: item.product.category,
              },
              quantity: item.quantity || 1,
              selectedColor: item.selectedColor,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            };
          })
          .filter(Boolean); // Remove null items

        console.log("Setting processed cart items:", processedItems);
        setItems(processedItems);
      } catch (error) {
        console.error("Error fetching cart:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch cart"
        );
        setItems([]); // Reset items on error
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]);

  // Save cart to localStorage when not logged in
  useEffect(() => {
    if (!user) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, user]);

  const addItem = async (
    product: Product,
    quantity: number = 1,
    selectedColor?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Store current items for error recovery
      const currentItems = [...items];

      if (!user) {
        // Handle local storage cart
        const newItem = {
          _id: Math.random().toString(36).substr(2, 9),
          product,
          quantity,
          selectedColor,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Immediately update items
        setItems((prevItems) => {
          // Check if item with same product and color exists
          const existingItemIndex = prevItems.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.selectedColor === selectedColor
          );

          if (existingItemIndex !== -1) {
            // Update existing item quantity
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity,
              updatedAt: new Date(),
            };
            return updatedItems;
          } else {
            // Add new item
            return [...prevItems, newItem];
          }
        });
        return;
      }

      // Add optimistic update for logged-in users
      const tempItem = {
        _id: Math.random().toString(36).substr(2, 9), // Temporary ID
        product,
        quantity,
        selectedColor,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Immediately update UI
      setItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedColor === selectedColor
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity,
            updatedAt: new Date(),
          };
          return updatedItems;
        } else {
          return [...prevItems, tempItem];
        }
      });

      // Make API call
      const response = await api.post(`/carts/${user.id}/items`, {
        productId: product.id,
        quantity,
        selectedColor,
      });

      console.log("Add to cart response:", response.data);

      // Update with server response
      if (response.data?.cart?.items) {
        setItems(response.data.cart.items);
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add item to cart"
      );

      // Revert optimistic update on error
      if (user) {
        const response = await api.get(`/carts/${user.id}`);
        if (response.data?.cart?.items) {
          setItems(response.data.cart.items);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const currentItems = [...items]; // Store current items state
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // Handle local storage cart
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity, updatedAt: new Date() }
              : item
          )
        );
        return;
      }

      const itemToUpdate = items.find((item) => item.product.id === productId);

      if (!itemToUpdate) {
        throw new Error("Item not found in cart");
      }

      // Optimistic update
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.product.id === productId
            ? { ...item, quantity, updatedAt: new Date() }
            : item
        )
      );

      const response = await api.put(
        `/carts/${user.id}/items/${itemToUpdate._id}`,
        {
          quantity,
        }
      );

      if (response.data?.cart?.items) {
        setItems(response.data.cart.items);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update quantity"
      );
      setItems(currentItems); // Revert to previous items on error
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (
    productId: string,
    selectedColor?: string,
    itemId?: string
  ) => {
    const currentItems = [...items]; // Store current state
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // If no user, just update localStorage
        const updatedItems = items.filter(
          (item) =>
            !(
              item.product.id === productId &&
              (!selectedColor || item.selectedColor === selectedColor) &&
              (!itemId || item._id === itemId)
            )
        );
        localStorage.setItem("cart", JSON.stringify(updatedItems));
        setItems(updatedItems);
        return;
      }

      // Make API call to remove item
      const response = await api.delete(
        `/carts/${user.id}/items/${productId}`,
        {
          data: { selectedColor, itemId },
        }
      );

      if (!response.data?.cart) {
        throw new Error("Invalid response from server");
      }

      // Update with server response
      if (response.data.cart.items) {
        setItems(response.data.cart.items);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove item"
      );

      // Revert optimistic update on error
      setItems(currentItems);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    // Store current items for error recovery at the beginning
    const currentItems: CartItem[] = [...items];

    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setItems([]);
        localStorage.removeItem("cart");
        return;
      }

      await api.delete(`/carts/${user.id}`);
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError(error instanceof Error ? error.message : "Failed to clear cart");
      setItems(currentItems); // Revert to previous items on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
        loading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
