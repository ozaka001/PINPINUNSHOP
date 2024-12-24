import { useState, useEffect } from 'react';
import { Search, Package2, ArrowUpDown, Filter, Eye, Printer, MessageSquare, X } from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.js';
import api from '../../services/api.js';
import toast, { ToastOptions } from '../../services/toast.js'; // Import toast service
import { useNavigate } from 'react-router-dom';
import ChatRoom from './ChatRoom.js';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const PrintReceipt = ({ order }: { order: Order }) => {
  return (
    <div className="p-8 max-w-2xl mx-auto bg-white">
      {/* Store Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">PIPPINUN SHOP</h1>
        <p>123 Fashion Street, Style City</p>
        <p>Tel: (555) 123-4567</p>
        <p>Email: contact@fashionstore.com</p>
      </div>

      <div className="border-t border-b py-4 mb-8">
        <h2 className="text-xl font-bold mb-4">Receipt</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Date:</strong> {order.date}</p>
          </div>
          <div>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">Customer Information</h3>
        <p><strong>Name:</strong> {order.firstName && order.lastName ? 
          `${order.firstName} ${order.lastName}` : 'N/A'}</p>
        <p><strong>Email:</strong> {order.email || 'N/A'}</p>
        <p><strong>Address:</strong> {order.shippingAddress || 'N/A'}</p>
        <p><strong>Phone:</strong> {order.shippingDetails?.phone || order.shippingDetails?.phoneNumber || 'N/A'}</p>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">Order Items</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Item</th>
              <th className="text-left py-2">Color</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{item.title}</td>
                <td className="py-2">{item.selectedColor}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">${item.price.toFixed(2)}</td>
                <td className="text-right py-2">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right py-4"><strong>Total:</strong></td>
              <td className="text-right py-4"><strong>${order.total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Thank you for shopping with us!</p>
        <p>For any inquiries, please contact our support team.</p>
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showSlip, setShowSlip] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      console.log('selectedOrder in render:', selectedOrder);
      console.log('selectedOrder items in render:', selectedOrder?.items);
    }
  }, [selectedOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders...');
      const response = await api.get('/orders');
      console.log('Full orders response:', JSON.stringify(response.data, null, 2));
      
      // Map backend response to frontend Order interface
      const mappedOrders = response.data.map((order: any) => {
        console.log('Processing order:', JSON.stringify(order, null, 2));
        console.log('Order shipping details:', order.shippingDetails);
        
        // Map order items
        const mappedItems = order.items.map((item: any) => ({
          id: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor
        }));

        // Get user data from shipping details
        const shippingDetails = order.shippingDetails || {};
        console.log('Extracted shipping details:', shippingDetails);
        
        const mappedOrder = {
          id: order._id,
          _id: order._id,
          userId: order.userId,
          firstName: shippingDetails.firstName,
          lastName: shippingDetails.lastName,
          email: shippingDetails.email,
          shippingDetails: shippingDetails,  // Keep the full shipping details
          total: order.totalAmount || 0,
          status: order.status || 'pending',
          items: mappedItems,
          date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date',
          shippingAddress: shippingDetails.address ? 
            `${shippingDetails.address}, ${shippingDetails.city || ''}, ${shippingDetails.postalCode || ''}, ${shippingDetails.country || ''}` : 
            'N/A',
          paymentMethod: order.paymentMethod || 'Unknown',
          slipUrl: order.slipUrl || null
        };
        
        console.log('Mapped order:', JSON.stringify(mappedOrder, null, 2));
        return mappedOrder;
      });

      console.log('Final mapped orders:', JSON.stringify(mappedOrders, null, 2));
      setOrders(mappedOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (response.data.order) {
        // Update the local state immediately
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Update the selected order if it's the one being modified
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        
        toast.success(`Order status updated to ${newStatus}`);
        await fetchOrders(); // Refresh all orders in the background
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      const errorMessage = err.response?.data?.error || "Failed to update order status. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: 'processing' });
      if (response.data.order) {
        await fetchOrders(); // Refresh orders after successful update
        toast.success("Order has been confirmed and is now being processed.");
      }
    } catch (error: any) {
      console.error('Error confirming order:', error);
      const errorMessage = error?.response?.data?.error || "Failed to confirm order. Please try again.";
      toast.error(errorMessage);
    }
  };

  const filteredOrders = loading ? [] : orders.filter(order => {
    if (!order || !order.id || !order.firstName || !order.lastName) return false;
    const orderIdMatch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const customerNameMatch = `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return (orderIdMatch || customerNameMatch) && matchesStatus;
  });

  const totalRevenue = loading ? 0 : orders.reduce((sum, order) => sum + (order?.total || 0), 0);
  const pendingOrders = loading ? 0 : orders.filter(order => order?.status === 'pending').length;
  const processingOrders = loading ? 0 : orders.filter(order => order?.status === 'processing').length;

  const handlePrintReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${order.id}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .text-right { text-align: right; }
              .mb-4 { margin-bottom: 16px; }
              .text-center { text-align: center; }
              @media print {
                body { margin: 0; padding: 20px; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              ${PrintReceipt({ order }).type.render()}
            </div>
            <script>
              window.onload = () => window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleChatWithCustomer = (userId: string) => {
    setShowChat(true);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Order Management</h2>
        <p className="text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Total Revenue</h3>
          <p className="text-2xl">${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Pending Orders</h3>
          <p className="text-2xl">{orders.filter(order => order.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Processing Orders</h3>
          <p className="text-2xl">{orders.filter(order => order.status === 'processing').length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="border rounded-lg px-4 py-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'all')}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">No orders found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders
                .filter(order => {
                  const matchesSearch = 
                    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
                  return matchesSearch && matchesStatus;
                })
                .map(order => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{`${order.firstName} ${order.lastName}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowSlip(true);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Printer size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowChat(true);
                          }}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chat Room Modal */}
      {showChat && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
            {/* Header with Back Button */}
            <div className="flex items-center p-4 border-b">
              <button 
                onClick={() => setShowChat(false)} 
                className="mr-3 p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-semibold">Chat - Order #{selectedOrder.id}</h3>
            </div>
            
            {/* Chat Content */}
            <ChatRoom 
              userId={selectedOrder.userId}
              customerName={`${selectedOrder.firstName} ${selectedOrder.lastName}`}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {showSlip && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Order Receipt</h3>
              <button onClick={() => setShowSlip(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <PrintReceipt order={selectedOrder} />
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrder && !showChat && !showSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Order Details #{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Payment Slip */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Payment Slip</h4>
                {selectedOrder.slipUrl ? (
                  <div className="flex justify-center">
                    <img 
                      src={selectedOrder.slipUrl} 
                      alt="Payment Slip" 
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No payment slip uploaded</p>
                )}
              </div>

              {/* Order Status Management */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Order Status</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                    className={`px-4 py-2 rounded-full ${
                      selectedOrder.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-800' 
                        : 'bg-white border border-gray-300 hover:bg-yellow-50'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    className={`px-4 py-2 rounded-full ${
                      selectedOrder.status === 'processing' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-800' 
                        : 'bg-white border border-gray-300 hover:bg-blue-50'
                    }`}
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                    className={`px-4 py-2 rounded-full ${
                      selectedOrder.status === 'completed' 
                        ? 'bg-green-100 text-green-800 border border-green-800' 
                        : 'bg-white border border-gray-300 hover:bg-green-50'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className={`px-4 py-2 rounded-full ${
                      selectedOrder.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800 border border-red-800' 
                        : 'bg-white border border-gray-300 hover:bg-red-50'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span>{' '}
                    {selectedOrder.firstName && selectedOrder.lastName ? 
                      `${selectedOrder.firstName} ${selectedOrder.lastName}` : 
                      ''}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    {selectedOrder.email}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{' '}
                    {selectedOrder.shippingDetails?.phone || selectedOrder.shippingDetails?.phoneNumber || 'Not provided'}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span>{' '}
                    {selectedOrder.shippingAddress}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2">Order Items</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-center py-2">Color</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.title}</td>
                        <td className="text-center py-2">{item.selectedColor || '-'}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">${item.price.toFixed(2)}</td>
                        <td className="text-right py-2">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right mt-4">
                  <p className="font-semibold">Total: ${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;