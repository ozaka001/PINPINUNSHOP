import { useRef, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { formatPrice } from '../utils/format.js';
import { useNavigate } from 'react-router-dom';
import { CartProduct } from '../types.js';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDropdown: React.FC<CartDropdownProps> = ({ isOpen, onClose }) => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, loading, error, setIsOpen } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const baseDropdownClasses = "fixed right-4 mt-2 w-96 bg-white rounded-lg shadow-lg border p-4 z-[100]";
  const dropdownStyles = { top: "4rem" };

  if (loading) {
    return (
      <div className={baseDropdownClasses} style={dropdownStyles} ref={dropdownRef}>
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={baseDropdownClasses} style={dropdownStyles} ref={dropdownRef}>
        <div className="text-red-500 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className={baseDropdownClasses} style={dropdownStyles} ref={dropdownRef}>
      {/* Cart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          <span className="font-medium">ตะกร้าของคุณ ({totalItems})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cart Items */}
      {items && items.length > 0 ? (
        <>
          <div className="max-h-[calc(100vh-16rem)] overflow-auto divide-y">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 py-4 border-b last:border-b-0"
              >
                {item.product ? (
                  <>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.product.name}</h4>
                      {item.product.category && (
                        <p className="text-sm text-gray-500">{item.product.category}</p>
                      )}
                      {item.selectedColor && (
                        <p className="text-sm text-gray-500">
                          สี: {item.selectedColor}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 flex items-center justify-center border rounded-full hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center border rounded-full hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">{formatPrice(item.product.price * item.quantity)}</p>
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedColor || '', item._id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        ลบ
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 text-center text-gray-500">
                    ไม่พบข้อมูลสินค้า
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cart Footer */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">ยอดรวม</span>
              <span className="font-medium text-lg">{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ชำระเงิน
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center flex-col gap-2 py-8">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500">ตะกร้าของคุณว่างเปล่า</p>
        </div>
      )}
    </div>
  );
};