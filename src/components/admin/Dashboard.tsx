import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight 
} from 'lucide-react';
import { Order, OrderItem, OrderStatus } from '../../types.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatPrice } from '../../utils/format.js';
import { dashboardService } from '../../services/dashboardService.js';

interface DashboardOrder {
  id: number;
  userId: number;
  customerName: string;
  totalAmount: number;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  shippingDetails: {
    firstName: string;
    lastName: string;
  }
}

interface DashboardStats {
  orderCount: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: DashboardOrder[];
  salesData: { date: string; sales: number; }[];
  visitorData: { date: string; visitors: number; }[];
  increases: {
    revenue: number;
    orders: number;
    users: number;
    products: number;
  };
}

interface Card {
  title: string;
  value: string;
  icon: any;
  colorClass: string;
  change: string;
  trend: 'up' | 'down';
}

interface StatusColors {
  [key: string]: string;
}

const statusColors: StatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800'
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    orderCount: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    salesData: [],
    visitorData: [],
    increases: {
      revenue: 0,
      orders: 0,
      users: 0,
      products: 0
    }
  });
  const [chartType, setChartType] = useState<'sales' | 'visitors'>('sales');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, recentOrders, salesData, visitorData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentOrders(),
          dashboardService.getSalesData(),
          dashboardService.getVisitorData()
        ]);

        setStats({
          orderCount: statsData.orderCount,
          totalProducts: statsData.totalProducts,
          totalUsers: statsData.totalUsers,
          totalRevenue: statsData.totalRevenue,
          recentOrders,
          salesData,
          visitorData,
          increases: statsData.increases
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const cards: Card[] = [
    {
      title: 'Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      colorClass: 'bg-green-100 text-green-800',
      change: `${stats.increases.revenue}% increase`,
      trend: stats.increases.revenue >= 0 ? 'up' : 'down'
    },
    {
      title: 'Total Orders',
      value: stats.orderCount.toString(),
      icon: ShoppingBag,
      colorClass: 'bg-blue-100 text-blue-800',
      change: `${stats.increases.orders}% increase`,
      trend: stats.increases.orders >= 0 ? 'up' : 'down'
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      colorClass: 'bg-purple-100 text-purple-800',
      change: `${stats.increases.products}% increase`,
      trend: stats.increases.products >= 0 ? 'up' : 'down'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      colorClass: 'bg-orange-100 text-orange-800',
      change: `${stats.increases.users}% increase`,
      trend: stats.increases.users >= 0 ? 'up' : 'down'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
              <div className={`bg-${card.colorClass.split(' ')[0]} p-2 rounded-lg`}>
                {React.createElement(card.icon, { className: 'w-5 h-5' })}
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              {card.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Sales Overview</h3>
            <div className="flex items-center space-x-4">
              <button 
                className={`text-sm font-medium ${chartType === 'sales' ? 'text-gray-900' : 'text-gray-400'} hover:text-gray-900`}
                onClick={() => setChartType('sales')}
              >
                Sales
              </button>
              <button 
                className={`text-sm font-medium ${chartType === 'visitors' ? 'text-gray-900' : 'text-gray-400'} hover:text-gray-900`}
                onClick={() => setChartType('visitors')}
              >
                Visitors
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartType === 'sales' ? stats.salesData : stats.visitorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey={chartType === 'sales' ? 'sales' : 'visitors'} 
                  fill="#4F46E5" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-900 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr key="header">
                  <th key="customer" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th key="amount" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th key="status" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(order.totalAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}