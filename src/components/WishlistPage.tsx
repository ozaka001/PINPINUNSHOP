import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Heart, Loader2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { Product, WishlistItem } from '../types.js';
import { formatPrice } from '../utils/format.js';
import api from '../services/api.js';

export function WishlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Get wishlist items
        const response = await api.get(`/wishlist/${user.id}`);
        if (!response.data) throw new Error('Failed to fetch wishlist');
        const data = response.data;
        
        if (data.items && Array.isArray(data.items)) {
          // The items already contain product details, so we can use them directly
          setWishlistItems(data.items.map((item: WishlistItem) => item.product));
        } else {
          console.error('Invalid response format:', data);
          setError('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setError('Failed to load wishlist items');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user, navigate]);

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const response = await api.delete('/wishlist/remove', {
        data: {
          userId: user.id,
          productId,
        },
      });

      if (response.status === 200) {
        setWishlistItems(items => items.filter(item => item.id !== productId));
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-8 text-3xl font-bold">My Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Heart className="w-16 h-16 text-gray-400" />
          <p className="text-xl text-gray-600">Your wishlist is empty</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wishlistItems.map(product => (
            <div
              key={product.id}
              className="overflow-hidden bg-white border rounded-lg shadow-sm"
            >
              <div className="relative group">
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover w-full h-48 transition-transform group-hover:scale-105"
                  onClick={() => navigate(`/product/${product.id}`)}
                />
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute p-2 transition-opacity bg-white rounded-full shadow-md opacity-0 top-2 right-2 group-hover:opacity-100"
                >
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </button>
              </div>
              
              <div className="p-4">
                <h3 
                  className="mb-2 text-lg font-semibold cursor-pointer hover:text-blue-500"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </h3>
                <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">{formatPrice(product.price)}</div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="p-2 text-blue-500 rounded-full hover:bg-blue-50"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
