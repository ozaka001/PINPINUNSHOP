import { useWishlist } from '../context/WishlistContext.js';
import { Heart, ShoppingBag, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/format.js';
import { useCart } from '../context/CartContext.js';
import { WishlistItem } from '../types.js';

export function Wishlist() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">สินค้าที่ถูกใจ</h1>
        <p className="text-gray-600">รายการสินค้าที่คุณสนใจ</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: WishlistItem) => (
            <div 
              key={item.product.id} 
              className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-6"
            >
              {/* Product Image */}
              <Link to={`/product/${item.product.id}`} className="shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </Link>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <Link 
                  to={`/product/${item.product.id}`}
                  className="group flex items-center gap-2"
                >
                  <h2 className="font-medium text-lg truncate group-hover:text-gray-600">
                    {item.product.name}
                  </h2>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-gray-500 mb-2">{item.product.category}</p>
                <p className="font-medium text-lg">{formatPrice(item.product.price)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => addItem(item.product)}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  <ShoppingBag className="w-4 h-4" />
                  เพิ่มลงตะกร้า
                </button>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="ลบออกจากสินค้าที่ถูกใจ"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">ยังไม่มีสินค้าที่ถูกใจ</h3>
          <p className="mt-2 text-gray-500">
            เริ่มเลือกสินค้าที่คุณสนใจโดยกดที่ไอคอนหัวใจ
          </p>
          <Link
            to="/products"
            className="mt-4 inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          >
            เริ่มช้อปปิ้ง
          </Link>
        </div>
      )}
    </div>
  );
}
