import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package2, Eye, ChevronDown, Search, Star } from 'lucide-react';
import { Order, OrderStatus } from '../types.js';
import { formatPrice } from '../utils/format.js';
import api from '../services/api.js';
import toast from '../services/toast.js';
import { useAuth } from '../context/AuthContext.js';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-emerald-100 text-emerald-800'
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ',
  processing: 'กำลังดำเนินการ',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิก',
  completed: 'สำเร็จ'
};

export function UserOrders() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const checkReviewStatus = async (productId: string) => {
    try {
      const response = await api.get(`/reviews/check/${productId}`);
      if (response.data.hasReviewed) {
        setReviewedProducts(prev => new Set([...prev, productId]));
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      console.log('Orders response:', response.data);
      setOrders(response.data);

      // Check review status for all products in completed/delivered orders
      const completedOrders = response.data.filter((order: any) => 
        order.status === 'completed' || order.status === 'delivered'
      );
      
      console.log('Completed orders:', completedOrders);
      for (const order of completedOrders) {
        console.log('Order items:', order.items);
        for (const item of order.items) {
          console.log('Item:', item);
          if (item && item.product_id) {
            await checkReviewStatus(item.product_id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
      // Refresh orders
      fetchOrders();
      toast.success("Order cancelled successfully.");
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error("Failed to cancel order. Please try again.");
    }
  };

  const handleReviewProduct = (item: any) => {
    if (!item?.product_id) {
      toast.error("Invalid product information");
      return;
    }
    setSelectedProduct(item);
    setIsReviewModalOpen(true);
  };

  const submitReview = async () => {
    try {
      if (!selectedProduct) {
        toast.error("No product selected for review");
        return;
      }

      const productId = selectedProduct.product_id.toString();
      await api.post('/reviews', {
        product_id: productId,
        rating: Number(rating),
        comment: reviewComment || ' '
      });

      setReviewedProducts(prev => new Set([...prev, productId]));
      setIsReviewModalOpen(false);
      setSelectedProduct(null);
      setRating(5);
      setReviewComment('');
      toast.success("ขอบคุณสำหรับการรีวิว!");
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.error || "ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่อีกครั้ง";
      toast.error(errorMessage);
    }
  };

  const filteredOrders = orders.filter(order => 
    order._id.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Loading...</h3>
        <p className="text-gray-500">Please wait while we load your orders.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Error</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">คำสั่งซื้อของฉัน</h1>
        <p className="text-gray-600">ติดตามและดูประวัติคำสั่งซื้อของคุณ</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex-1 min-w-[150px] bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">คำสั่งซื้อทั้งหมด</p>
              <p className="text-lg font-semibold">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[150px] bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">สำเร็จแล้ว</p>
              <p className="text-lg font-semibold">
                {orders.filter(order => order.status === 'delivered' || order.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[150px] bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package2 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">กำลังดำเนินการ</p>
              <p className="text-lg font-semibold">
                {orders.filter(order => order.status === 'processing').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="ค้นหาหมายเลขคำสั่งซื้อ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border rounded-lg"
        />
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.map((order) => (
          <div key={order._id.toString()} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            {/* Order Header */}
            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">Order ID:</span>
                  <span className="font-medium">{order._id.toString().slice(-8).toUpperCase()}</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm text-gray-500">วันที่สั่งซื้อ</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4">
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-2 border-b last:border-b-0">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">จำนวน: {item.quantity} ชิ้น</p>
                      <p className="text-sm font-medium">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Actions */}
            <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>ดูรายละเอียด</span>
                </button>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order._id.toString())}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2 transition-colors"
                  >
                    <span>ยกเลิก Order</span>
                  </button>
                )}
                {(order.status === 'delivered' || order.status === 'completed') && order.items.map((item) => {
                  const productIdString = item?.product_id?.toString();
                  return productIdString && !reviewedProducts.has(productIdString) && (
                    <button
                      key={productIdString}
                      onClick={() => handleReviewProduct(item)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      <span>รีวิวสินค้า</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">ยอดรวมทั้งหมด</p>
                <p className="text-lg font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
              </div>
            </div>

            {/* Order Details (Expandable) */}
            {selectedOrder?._id === order._id && (
              <div className="p-6 bg-gray-50 border-t space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">ที่อยู่จัดส่ง</h4>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600">{order.shippingDetails.address}</p>
                      <p className="text-gray-600">{order.shippingDetails.city} {order.shippingDetails.postalCode}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">วิธีการชำระเงิน</h4>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600">{order.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <Package2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">ไม่พบคำสั่งซื้อ</h3>
          <p className="text-gray-500 mb-6">คุณยังไม่มีคำสั่งซื้อในขณะนี้</p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Package2 className="w-5 h-5 mr-2" />
            เริ่มช้อปปิ้ง
          </Link>
        </div>
      )}
      {/* Review Modal */}
      {isReviewModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">รีวิวสินค้า: {selectedProduct.title}</h3>
            
            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={'p-1 ' + (rating >= star ? 'text-yellow-500' : 'text-gray-300')}
                  >
                    <Star className="w-6 h-6" />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">ความคิดเห็น</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={4}
                placeholder="แสดงความคิดเห็นของคุณ..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={submitReview}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                ส่งรีวิว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}