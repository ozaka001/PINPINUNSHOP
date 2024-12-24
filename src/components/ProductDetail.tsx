import { useState, useEffect } from "react";
import { Review } from "../types.js";
import {
  Heart,
  Minus,
  Plus,
  Share2,
  Star,
  StarHalf,
  MessageSquare,
  Copy,
  Check
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Product } from "../types.js";
import { useAuth } from "../context/AuthContext.js";
import { ReviewCard } from "./ReviewCard.js";
import { useCart } from "../context/CartContext.js";
import { formatPrice } from "../utils/format.js";
import { Modal, Button } from "react-bootstrap";
import { useWishlist } from "../context/WishlistContext.js";
import api from '../services/api.js';

// Colors configuration
const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Navy", value: "#000080" },
  { name: "Gray", value: "#808080" },
  { name: "Brown", value: "#A52A2A" },
  { name: "Red", value: "#FF0000" },
  { name: "Green", value: "#008000" },
  { name: "Blue", value: "#0000FF" },
];

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist: checkIsInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [showFilter, setShowFilter] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        navigate('/');
        return;
      }

      try {
        // Connect to database directly
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const productData = await response.json();
        if (!productData) {
          setError('Product not found. Please check the ID or try again later.');
          return;
        }
        
        // Debug logging
        console.log('Raw Product Data:', productData);
        console.log('Additional Images:', productData.additionalImages);
        console.log('Additional Images Type:', Array.isArray(productData.additionalImages) ? 'Array' : typeof productData.additionalImages);
        
        // Ensure additionalImages is always an array
        const normalizedProduct = {
          ...productData,
          additionalImages: Array.isArray(productData.additionalImages) ? productData.additionalImages : []
        };
        
        console.log('Normalized Product:', normalizedProduct);
        setProduct(normalizedProduct);
        
        // Fetch category name
        const categoryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/categories`);
        if (categoryResponse.ok) {
          const categories = await categoryResponse.json();
          const category = categories.find((cat: any) => cat.id === productData.category);
          if (category) {
            setCategoryName(category.name);
          }
        }
        
        // Fetch similar products directly from database
        const similarResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`);
        if (!similarResponse.ok) {
          throw new Error('Failed to fetch similar products');
        }
        const allProducts = await similarResponse.json();
        const similar = allProducts
          .filter((p: Product) => p.category === productData.category && p.id !== productData.id)
          .slice(0, 4);
        setSimilarProducts(similar);
        
        setError(null);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setIsInWishlist(checkIsInWishlist(product.id));
      fetchReviews();
    }
  }, [product, checkIsInWishlist]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/product/${product?.id}`);
      const reviewData = response.data;
      setReviews(reviewData);
      setFilteredReviews(reviewData);
      
      // Calculate average rating
      if (reviewData.length > 0) {
        const total = reviewData.reduce((sum: number, review: Review) => sum + review.rating, 0);
        setAverageRating(total / reviewData.length);
        setReviewCount(reviewData.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleQuantityChange = (type: "increase" | "decrease") => {
    if (!product) return;
    
    if (type === "decrease" && quantity > 1) {
      setQuantity(quantity - 1);
    } else if (type === "increase" && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }
    addItem(product, quantity, selectedColor);
  };

  const handleFilterClick = () => setShowFilter(true);
  const handleClose = () => setShowFilter(false);

  const applyFilter = (rating: number | null) => {
    setSelectedRating(rating);
    if (rating) {
      const filtered = reviews.filter(review => review.rating === rating);
      setFilteredReviews(filtered);
    } else {
      setFilteredReviews(reviews);
    }
    setShowFilter(false);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, index) => (
          <Star
            key={index}
            className="w-5 h-5 text-yellow-400 fill-yellow-400"
          />
        ))}
        {hasHalfStar && (
          <StarHalf className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        )}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, index) => (
          <Star
            key={`empty-${index}`}
            className="w-5 h-5 text-gray-300"
          />
        ))}
      </div>
    );
  };

  const handleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) {
      console.error('Product not found');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name,
      text: product?.description,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
  </div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
  if (!product) return <div className="flex items-center justify-center min-h-screen">No product found.</div>;

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6">
      {/* Product Details */}
      <div className="grid grid-cols-1 gap-8 mb-16 md:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">
            <img
              src={selectedImage === 0 ? product.image : (product.additionalImages?.[selectedImage - 1] || product.image)}
              alt={product.name}
              className="object-cover object-center w-full h-full"
            />
          </div>
          <div className="relative">
            {/* Left Navigation Button */}
            <button
              onClick={() => {
                const totalImages = 1 + (product.additionalImages?.length || 0);
                setSelectedImage((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
              }}
              className="absolute left-2 z-10 flex items-center justify-center w-10 h-10 rounded-md bg-white bg-opacity-80 shadow-sm hover:bg-opacity-100 transition-all duration-200 top-1/2 -translate-y-1/2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Right Navigation Button */}
            <button
              onClick={() => {
                const totalImages = 1 + (product.additionalImages?.length || 0);
                setSelectedImage((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
              }}
              className="absolute right-2 z-10 flex items-center justify-center w-10 h-10 rounded-md bg-white bg-opacity-80 shadow-sm hover:bg-opacity-100 transition-all duration-200 top-1/2 -translate-y-1/2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <div className="flex justify-center space-x-4">
              {/* Main image thumbnail */}
              <button
                onClick={() => setSelectedImage(0)}
                className={`flex-none w-24 aspect-[3/4] overflow-hidden rounded-lg ${
                  selectedImage === 0 ? "ring-2 ring-black" : ""
                }`}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-cover object-center w-full h-full hover:opacity-75"
                />
              </button>
              {/* Additional images thumbnails */}
              {product.additionalImages?.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index + 1)}
                  className={`flex-none w-24 aspect-[3/4] overflow-hidden rounded-lg ${
                    selectedImage === index + 1 ? "ring-2 ring-black" : ""
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    className="object-cover object-center w-full h-full hover:opacity-75"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-medium text-gray-900">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(product.price * 1.2)}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Category</h3>
            <p className="text-sm text-gray-500">{categoryName || "Loading..."}</p>
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Colors</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const colorConfig = COLORS.find(c => c.name.toLowerCase() === color.toLowerCase());
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color 
                          ? 'border-black ring-2 ring-black ring-offset-2' 
                          : 'border-gray-200 hover:border-gray-400'
                      } focus:outline-none`}
                      style={{ 
                        backgroundColor: colorConfig?.value || color,
                        border: colorConfig?.name === 'White' ? '1px solid #e5e7eb' : undefined
                      }}
                      title={color}
                    />
                  );
                })}
              </div>
              {selectedColor && (
                <p className="text-sm text-gray-500">
                  Selected: {selectedColor}
                </p>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange("decrease")}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center">{quantity}</span>
              <button
                onClick={() => handleQuantityChange("increase")}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="grid gap-4">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-black"
              >
                Add to Cart
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-black"
                >
                  <Heart className={isInWishlist ? "fill-red-500 text-red-500" : ""} size={20} />
                  {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-black"
                >
                  {isCopied ? (
                    <>
                      <Check size={20} className="text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 size={20} />
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="pt-6 space-y-4 border-t">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <p className="mt-2 text-sm text-gray-500">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pt-16 border-t">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            <div className="flex items-center gap-2 mt-2">
              {renderStars(averageRating)}
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">({reviewCount} reviews)</span>
            </div>
          </div>
          <button
            onClick={handleFilterClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            Filter Reviews
          </button>
        </div>

        <Modal show={showFilter} onHide={handleClose} centered className="font-sans">
          <Modal.Header closeButton className="border-b border-gray-100 bg-gray-50">
            <Modal.Title className="text-lg font-medium text-gray-900">Filter Reviews</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-6">
            <h5 className="mb-4 text-sm font-medium text-gray-700">Select Star Rating</h5>
            <div className="space-y-2">
              <button
                onClick={() => applyFilter(null)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <span>All Reviews</span>
                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  {reviews.length}
                </span>
              </button>
              {[5, 4, 3, 2, 1].map((rating) => {
                const ratingCount = reviews.filter(review => review.rating === rating).length;
                return (
                  <button
                    key={rating}
                    onClick={() => applyFilter(rating)}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <div className="flex items-center">
                      {[...Array(rating)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                      ))}
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                      {ratingCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </Modal.Body>
        </Modal>

        {/* Review List */}
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {review.userName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{review.userName}</h4>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-2">{review.comment}</p>
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {selectedRating 
                ? `No ${selectedRating}-star reviews yet` 
                : 'No reviews yet'}
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      <div className="pt-16 border-t">
        <h2 className="mb-8 text-2xl font-bold">You May Also Like</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {similarProducts.map((product) => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              className="group cursor-pointer transition-transform hover:scale-105"
            >
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={(product.image)}
                  alt={product.name}
                  className="object-cover object-center w-full h-full group-hover:opacity-75"
                />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{categoryName}</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
