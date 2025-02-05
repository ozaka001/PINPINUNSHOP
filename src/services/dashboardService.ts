import { DashboardStats, Order, OrderItem, OrderStatus } from '../types.js';
import api from './api.js';

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
  };
}

interface RecentOrder {
  id: number;
  user_id: number;
  customerName: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
}

interface SalesData {
  date: string;
  sales: number;
}

interface VisitorData {
  date: string;
  visitors: number;
}

// Generate mock sales data for the last 7 days
const generateMockSalesData = (days: number): SalesData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 10000) + 1000
    };
  }).reverse();
};

// Generate mock visitor data for the last 7 days
const generateMockVisitorData = (days: number): VisitorData[] => {
  return Array.from({ length: days }, (_, i) => { 
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString().split('T')[0],
      visitors: Math.floor(Math.random() * 100) + 50 // Random number between 50-150
    };
  }).reverse();
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      console.log('Fetching dashboard stats...');
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard stats response:', response.data);
      
      // Map the response to match the DashboardStats interface
      return {
        orderCount: response.data.totalOrders,
        totalProducts: response.data.totalProducts,
        totalUsers: response.data.totalUsers,
        totalRevenue: response.data.totalRevenue,
        recentOrders: response.data.recentOrders || [],
        salesData: response.data.salesData || [],
        visitorData: response.data.visitorData || [],
        increases: response.data.increases || {
          revenue: 0,
          orders: 0,
          users: 0,
          products: 0
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getRecentOrders(): Promise<DashboardOrder[]> {
    try {
      const response = await api.get('/dashboard/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  },

  async getSalesData(): Promise<SalesData[]> {
    try {
      const response = await api.get('/dashboard/sales');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return generateMockSalesData(7);
    }
  },

  async getVisitorData(): Promise<VisitorData[]> {
    try {
      const response = await api.get('/dashboard/visitors');
      return response.data;
    } catch (error) {
      console.error('Error fetching visitor data:', error);
      return generateMockVisitorData(7);
    }
  }
};
