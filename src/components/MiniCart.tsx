import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { formatPrice } from '../utils/format.js';
import { Link } from 'react-router-dom';

export function MiniCart() {
  const { items, totalItems, totalPrice, setIsOpen } = useCart();

  if (totalItems === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border p-4">
        <div className="flex items-center justify-center flex-col gap-2 py-8">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">ตะกร้าของคุณว่างเปล่า</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border divide-y">
      {/* Cart Items */}
      <div className="max-h-64 overflow-auto divide-y">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-3 p-3">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
              <p className="text-sm text-gray-500">จำนวน: {item.quantity}</p>
              <p className="text-sm font-medium">{formatPrice(item.product.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="p-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">รวมทั้งหมด</span>
          <span className="font-medium">{formatPrice(totalPrice)}</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full px-4 py-2 text-sm text-center bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            ดูตะกร้าสินค้า
          </button>
          <Link
            to="/checkout"
            className="block w-full px-4 py-2 text-sm text-center text-white bg-black rounded-lg hover:bg-gray-800"
          >
            ชำระเงิน
          </Link>
        </div>
      </div>
    </div>
  );
}