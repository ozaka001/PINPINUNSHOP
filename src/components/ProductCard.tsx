import { useState, useEffect } from "react";
import { Product } from "../types.js";
import { ShoppingBag, Heart, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.js";
import { useWishlist } from "../context/WishlistContext.js";
import { useAuth } from "../context/AuthContext.js";
import { formatPrice } from "../utils/format.js";
import { toast } from 'react-hot-toast'; // Import toast

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist, fetchWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    const fetchCategoryName = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/categories`);
        if (response.ok) {
          const categories = await response.json();
          const category = categories.find((cat: any) => cat.id === product.category);
          if (category) {
            setCategoryName(category.name);
          }
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };

    fetchCategoryName();
  }, [product.category]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
      // Force refresh wishlist state after operation
      await fetchWishlist();
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const convertBufferToDataUrl = (image: string | Buffer): string => {
    if (!image) return ''; // Handle null or undefined case
    if (typeof image === 'string') {
      // If it's already a base64 data URL, return as is
      if (image.startsWith('data:')) {
        return image;
      }
      // If it's a base64 string without data URL prefix, add it
      return `data:image/jpeg;base64,${image}`;
    }
    // If it's a Buffer, convert to base64
    return `data:image/jpeg;base64,${Buffer.from(image).toString('base64')}`;
  };

  return (
    <Link to={`/product/${product.id}`} className="relative group">
      <div className="w-full overflow-hidden bg-gray-100 rounded-lg aspect-square">
        <img
          src={convertBufferToDataUrl(product.image)}
          alt={product.name}
          className="object-cover object-center w-full h-full group-hover:opacity-75"
        />
        <button
          onClick={handleWishlistClick}
          className="absolute p-2 bg-white rounded-full shadow-sm top-2 right-2 hover:bg-gray-100"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart
              className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`}
            />
          )}
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-700 truncate">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500">{categoryName || "Loading..."}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            {formatPrice(product.price)}
          </p>
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product, 1);
            }}
            className="p-1.5 text-blue-600 rounded-full hover:bg-blue-50"
          >
          </button>
        </div>
      </div>
    </Link>
  );
}
